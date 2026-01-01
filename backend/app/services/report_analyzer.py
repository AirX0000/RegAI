"""
Report Analyzer Service
Analyzes financial reports for tax compliance using AI
"""
import os
import re
from typing import Dict, List, Any, Tuple
from decimal import Decimal
from datetime import datetime, timezone
import uuid

# For PDF extraction
try:
    import PyPDF2
except ImportError:
    PyPDF2 = None

# For Excel extraction
try:
    import openpyxl
    import pandas as pd
except ImportError:
    openpyxl = None
    pd = None

from sqlalchemy.orm import Session
from app.db.models.tax_rate import TaxRate
from app.db.models.report_analysis import ReportAnalysis
from app.rag.retriever import query_rag


class ReportAnalyzer:
    def __init__(self, db: Session):
        self.db = db
    
    def analyze_report(
        self,
        report_id: uuid.UUID,
        file_path: str,
        country_code: str,
        tax_types: List[str]
    ) -> ReportAnalysis:
        """
        Main analysis function
        """
        # Create analysis record
        analysis = ReportAnalysis(
            id=uuid.uuid4(),
            report_id=report_id,
            country_code=country_code,
            tax_types=tax_types,
            status="processing",
            started_at=datetime.now(timezone.utc)
        )
        self.db.add(analysis)
        self.db.commit()
        
        try:
            # Extract text from file
            file_ext = os.path.splitext(file_path)[1].lower()
            if file_ext == '.pdf':
                text = self._extract_pdf_text(file_path)
            elif file_ext in ['.xlsx', '.xls']:
                text = self._extract_excel_text(file_path)
            else:
                text = self._extract_plain_text(file_path)
            
            # Get applicable tax rates
            tax_rates = self._get_tax_rates(country_code, tax_types)
            
            # Check data convergence (math checks)
            convergence_errors = self._check_data_convergence(file_path, file_ext)
            
            # Analyze with AI
            errors = self._analyze_with_ai(text, tax_rates, country_code)
            errors.extend(convergence_errors)
            
            # Calculate scores
            total_checks = len(errors) + 20  # Base checks
            passed = total_checks - len([e for e in errors if e['severity'] == 'critical'])
            warnings_count = len([e for e in errors if e['severity'] == 'warning'])
            errors_count = len([e for e in errors if e['severity'] == 'critical'])
            
            score = int((passed / total_checks) * 100) if total_checks > 0 else 100
            
            # Update analysis
            analysis.status = "completed"
            analysis.overall_score = score
            analysis.total_checks = total_checks
            analysis.passed_checks = passed
            analysis.warnings = warnings_count
            analysis.errors = errors_count
            analysis.error_details = errors
            analysis.summary = self._generate_summary(errors, score)
            analysis.completed_at = datetime.now(timezone.utc)
            
            self.db.commit()
            self.db.refresh(analysis)
            
            return analysis
            
        except Exception as e:
            analysis.status = "failed"
            analysis.summary = f"Analysis failed: {str(e)}"
            self.db.commit()
            raise
    
    def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF"""
        if not PyPDF2:
            return "PDF extraction not available. Install PyPDF2."
        
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    
    def _extract_excel_text(self, file_path: str) -> str:
        """Extract text from Excel"""
        if not openpyxl:
            return "Excel extraction not available. Install openpyxl."
        
        workbook = openpyxl.load_workbook(file_path, data_only=True)
        text = ""
        
        for sheet in workbook.worksheets:
            text += f"\n=== Sheet: {sheet.title} ===\n"
            for row in sheet.iter_rows(values_only=True):
                row_text = " | ".join([str(cell) if cell is not None else "" for cell in row])
                if row_text.strip():
                    text += row_text + "\n"
        
        return text
    
    def _extract_plain_text(self, file_path: str) -> str:
        """Extract plain text"""
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
            return file.read()

    def _check_data_convergence(self, file_path: str, file_ext: str) -> List[Dict[str, Any]]:
        """
        Check if data converges (e.g. totals match subtotals)
        """
        errors = []
        
        if file_ext in ['.xlsx', '.xls'] and pd:
            try:
                # Load all sheets
                xls = pd.ExcelFile(file_path)
                for sheet_name in xls.sheet_names:
                    df = pd.read_excel(xls, sheet_name=sheet_name)
                    
                    # Simple heuristic: Look for "Total" rows and check sums
                    # This is a basic implementation - real world would be more complex
                    numeric_cols = df.select_dtypes(include=['number']).columns
                    
                    for idx, row in df.iterrows():
                        # Check if first column contains "Total"
                        first_val = str(row.iloc[0]) if len(row) > 0 else ""
                        if "total" in first_val.lower():
                            # This is a total row. Let's see if we can verify it.
                            # We'll try to sum the previous 5 rows (heuristic)
                            start_idx = max(0, idx - 5)
                            if start_idx < idx:
                                subset = df.iloc[start_idx:idx]
                                
                                for col in numeric_cols:
                                    try:
                                        calc_sum = subset[col].sum()
                                        reported_total = row[col]
                                        
                                        # If reported total is not null and looks like a sum
                                        if pd.notna(reported_total) and reported_total != 0:
                                            # Allow small float error
                                            if abs(calc_sum - reported_total) > 1.0:
                                                errors.append({
                                                    "severity": "critical",
                                                    "type": "math_error",
                                                    "location": f"Sheet: {sheet_name}, Row: {idx+1}, Col: {col}",
                                                    "expected": float(calc_sum),
                                                    "found": float(reported_total),
                                                    "impact": "Potential calculation error in total",
                                                    "currency": None,
                                                    "recommendation": f"Verify total. Calculated: {calc_sum}, Reported: {reported_total}"
                                                })
                                    except Exception:
                                        pass
            except Exception as e:
                print(f"Convergence check failed: {e}")
                
        return errors
    
    def _get_tax_rates(self, country_code: str, tax_types: List[str]) -> Dict[str, Decimal]:
        """Get current tax rates for country"""
        rates = {}
        for tax_type in tax_types:
            rate = self.db.query(TaxRate).filter(
                TaxRate.country_code == country_code,
                TaxRate.tax_type == tax_type,
                TaxRate.effective_to.is_(None)
            ).first()
            
            if rate:
                rates[tax_type] = rate.rate
        
        return rates
    
    def _analyze_with_ai(
        self,
        text: str,
        tax_rates: Dict[str, Decimal],
        country_code: str
    ) -> List[Dict[str, Any]]:
        """
        Use AI to analyze the report and find compliance issues
        """
        errors = []
        
        # Find all percentage values in text
        percentage_pattern = r'(\d+\.?\d*)\s*%'
        matches = re.finditer(percentage_pattern, text)
        
        for match in matches:
            found_rate = Decimal(match.group(1))
            
            # Check against expected rates
            for tax_type, expected_rate in tax_rates.items():
                if abs(found_rate - expected_rate) > Decimal('0.5'):
                    # Potential mismatch found
                    errors.append({
                        "severity": "critical" if abs(found_rate - expected_rate) > 2 else "warning",
                        "type": "incorrect_rate",
                        "location": f"Found in document text",
                        "expected": float(expected_rate),
                        "found": float(found_rate),
                        "impact": None,
                        "currency": self._get_currency(country_code),
                        "recommendation": f"Verify {tax_type} rate. Expected: {expected_rate}%, Found: {found_rate}%"
                    })
        
        # Use AI for deeper analysis
        ai_prompt = f"""
        Analyze this financial report for {country_code} tax compliance.
        Expected tax rates: {tax_rates}
        
        Report excerpt:
        {text[:2000]}
        
        Identify any:
        1. Incorrect tax calculations
        2. Missing required fields
        3. Compliance issues
        
        Return specific errors with locations.
        
        Also, verify that all totals and subtotals in the text are mathematically correct.
        If you find any arithmetic errors (e.g. items not adding up to total), report them as critical errors.
        """
        
        try:
            # Use RAG for AI analysis
            ai_response = query_rag(ai_prompt, str(uuid.uuid4()))
            
            # Parse AI response for additional errors
            if "error" in ai_response.lower() or "missing" in ai_response.lower():
                errors.append({
                    "severity": "warning",
                    "type": "ai_detected_issue",
                    "location": "AI Analysis",
                    "expected": None,
                    "found": None,
                    "impact": None,
                    "currency": None,
                    "recommendation": ai_response[:200]
                })
        except Exception as e:
            print(f"AI analysis error: {e}")
        
        return errors
    
    def _get_currency(self, country_code: str) -> str:
        """Get currency code for country"""
        currency_map = {
            "GB": "GBP",
            "US": "USD",
            "DE": "EUR",
            "FR": "EUR",
            "ES": "EUR",
            "IT": "EUR",
            "CA": "CAD",
            "AU": "AUD",
            "JP": "JPY",
            "SG": "SGD",
            "CH": "CHF"
        }
        return currency_map.get(country_code, "USD")
    
    def _generate_summary(self, errors: List[Dict], score: int) -> str:
        """Generate human-readable summary"""
        if score >= 90:
            status = "Excellent compliance"
        elif score >= 70:
            status = "Good compliance with minor issues"
        elif score >= 50:
            status = "Moderate compliance - attention needed"
        else:
            status = "Poor compliance - immediate action required"
        
        critical_count = len([e for e in errors if e['severity'] == 'critical'])
        warning_count = len([e for e in errors if e['severity'] == 'warning'])
        
        summary = f"{status}. Score: {score}/100. "
        if critical_count > 0:
            summary += f"{critical_count} critical error(s) found. "
        if warning_count > 0:
            summary += f"{warning_count} warning(s) found."
        
        return summary
