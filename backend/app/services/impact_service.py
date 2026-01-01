import json
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.db.models.regulation import Regulation
from app.db.models.company import Company
from app.db.models.impact_analysis import RegulationImpact
from app.core.config import settings
import openai
import logging

logger = logging.getLogger(__name__)

class ImpactService:
    def __init__(self, db: Session):
        self.db = db
        openai.api_key = settings.OPENAI_API_KEY
    
    def analyze_impact(self, regulation_id: str, company_id: str) -> Dict[str, Any]:
        """
        Analyze the impact of a regulation on a specific company using AI.
        
        Returns:
            Dict with keys: impact_score (1-10), summary (str), action_items (list)
        """
        # Fetch regulation and company
        regulation = self.db.query(Regulation).filter(Regulation.id == regulation_id).first()
        company = self.db.query(Company).filter(Company.id == company_id).first()
        
        if not regulation or not company:
            raise ValueError("Regulation or Company not found")
        
        # Check if analysis already exists
        existing = self.db.query(RegulationImpact).filter(
            RegulationImpact.regulation_id == regulation_id,
            RegulationImpact.company_id == company_id
        ).first()
        
        if existing:
            return {
                "impact_score": existing.impact_score,
                "summary": existing.summary,
                "action_items": json.loads(existing.action_items) if existing.action_items else []
            }
        
        # Generate AI analysis
        try:
            analysis = self._generate_ai_analysis(regulation, company)
            
            # Save to database
            impact_record = RegulationImpact(
                regulation_id=regulation_id,
                company_id=company_id,
                impact_score=analysis["impact_score"],
                summary=analysis["summary"],
                action_items=json.dumps(analysis["action_items"])
            )
            self.db.add(impact_record)
            self.db.commit()
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error generating impact analysis: {str(e)}")
            self.db.rollback()
            raise
    
    def _generate_ai_analysis(self, regulation: Regulation, company: Company) -> Dict[str, Any]:
        """Use OpenAI to analyze regulation impact"""
        
        prompt = f"""You are a regulatory compliance expert. Analyze the impact of this regulation on the given company.

**Regulation:**
- Title: {regulation.title}
- Code: {regulation.code}
- Category: {regulation.category}
- Jurisdiction: {regulation.jurisdiction}
- Content Summary: {regulation.content[:500] if regulation.content else 'No content available'}...

**Company:**
- Name: {company.name}
- Industry: {company.industry}
- Description: {company.description}
- Location: {company.location if hasattr(company, 'location') else 'Not specified'}

**Task:**
1. Assign an impact score from 1-10 (1=minimal, 10=critical)
2. Write a 2-3 sentence summary of the impact
3. List 3-5 specific action items the company should take

Respond in JSON format:
{{
    "impact_score": <number>,
    "summary": "<text>",
    "action_items": ["<item1>", "<item2>", ...]
}}"""

        try:
            response = openai.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a regulatory compliance expert. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Parse JSON response
            if result_text.startswith("```json"):
                result_text = result_text[7:-3].strip()
            elif result_text.startswith("```"):
                result_text = result_text[3:-3].strip()
            
            analysis = json.loads(result_text)
            
            # Validate structure
            if not all(k in analysis for k in ["impact_score", "summary", "action_items"]):
                raise ValueError("Invalid AI response structure")
            
            return analysis
            
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            # Return fallback analysis
            return {
                "impact_score": 5,
                "summary": f"This regulation ({regulation.category}) may affect {company.industry} companies. Manual review recommended.",
                "action_items": [
                    "Review the full regulation text",
                    "Consult with legal counsel",
                    "Assess current compliance status"
                ]
            }
