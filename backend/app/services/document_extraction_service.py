import os
import json
import logging
from typing import Dict, Any, Optional
from pathlib import Path
import pytesseract
from PIL import Image
from PyPDF2 import PdfReader
from pdf2image import convert_from_path
import openai
from app.core.config import settings

logger = logging.getLogger(__name__)

class DocumentExtractionService:
    def __init__(self):
        openai.api_key = settings.OPENAI_API_KEY
        self.upload_dir = Path("uploads/documents")
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    def extract_text_from_image(self, image_path: str) -> str:
        """Extract text from an image using OCR"""
        try:
            image = Image.open(image_path)
            text = pytesseract.image_to_string(image)
            return text.strip()
        except Exception as e:
            logger.error(f"OCR error for {image_path}: {str(e)}")
            raise
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text from PDF (handles both text and scanned PDFs)"""
        try:
            # Try text extraction first
            reader = PdfReader(pdf_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            
            # If no text found, use OCR
            if len(text.strip()) < 50:
                logger.info(f"PDF appears to be scanned, using OCR for {pdf_path}")
                images = convert_from_path(pdf_path)
                text = ""
                for i, image in enumerate(images):
                    text += pytesseract.image_to_string(image) + "\n"
            
            return text.strip()
        except Exception as e:
            logger.error(f"PDF extraction error for {pdf_path}: {str(e)}")
            raise
    
    def extract_text(self, file_path: str) -> str:
        """Extract text from file based on extension"""
        ext = Path(file_path).suffix.lower()
        
        if ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
            return self.extract_text_from_image(file_path)
        elif ext == '.pdf':
            return self.extract_text_from_pdf(file_path)
        else:
            raise ValueError(f"Unsupported file type: {ext}")
    
    def extract_invoice_data(self, text: str) -> Dict[str, Any]:
        """Extract structured data from invoice text using AI"""
        prompt = f"""Extract the following information from this invoice text. Return ONLY valid JSON.

Invoice Text:
{text[:2000]}

Extract:
- invoice_number: string
- invoice_date: string (YYYY-MM-DD format)
- due_date: string (YYYY-MM-DD format if available)
- vendor_name: string
- vendor_address: string
- total_amount: number
- currency: string (e.g., "USD", "EUR")
- line_items: array of {{description: string, quantity: number, unit_price: number, total: number}}

Return JSON format:
{{
    "invoice_number": "...",
    "invoice_date": "...",
    "due_date": "...",
    "vendor_name": "...",
    "vendor_address": "...",
    "total_amount": 0.00,
    "currency": "USD",
    "line_items": [...]
}}"""

        return self._call_openai_extraction(prompt)
    
    def extract_contract_data(self, text: str) -> Dict[str, Any]:
        """Extract structured data from contract text using AI"""
        prompt = f"""Extract the following information from this contract text. Return ONLY valid JSON.

Contract Text:
{text[:2000]}

Extract:
- contract_title: string
- parties: array of {{name: string, role: string}}
- effective_date: string (YYYY-MM-DD)
- expiration_date: string (YYYY-MM-DD if available)
- contract_value: number (if mentioned)
- key_terms: array of strings (3-5 main terms)

Return JSON format:
{{
    "contract_title": "...",
    "parties": [{{name": "...", "role": "..."}}],
    "effective_date": "...",
    "expiration_date": "...",
    "contract_value": 0.00,
    "key_terms": [...]
}}"""

        return self._call_openai_extraction(prompt)
    
    def extract_bank_statement_data(self, text: str) -> Dict[str, Any]:
        """Extract structured data from bank statement text using AI"""
        prompt = f"""Extract the following information from this bank statement text. Return ONLY valid JSON.

Bank Statement Text:
{text[:2000]}

Extract:
- account_number: string (last 4 digits)
- statement_period: string (e.g., "2024-01-01 to 2024-01-31")
- opening_balance: number
- closing_balance: number
- total_deposits: number
- total_withdrawals: number
- transactions: array of {{date: string, description: string, amount: number, type: "debit"|"credit"}} (up to 10 most recent)

Return JSON format:
{{
    "account_number": "****1234",
    "statement_period": "...",
    "opening_balance": 0.00,
    "closing_balance": 0.00,
    "total_deposits": 0.00,
    "total_withdrawals": 0.00,
    "transactions": [...]
}}"""

        return self._call_openai_extraction(prompt)
    
    def _call_openai_extraction(self, prompt: str) -> Dict[str, Any]:
        """Call OpenAI API for structured extraction"""
        try:
            response = openai.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a document data extraction expert. Always return valid JSON only, no additional text."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=1000
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Clean JSON response
            if result_text.startswith("```json"):
                result_text = result_text[7:-3].strip()
            elif result_text.startswith("```"):
                result_text = result_text[3:-3].strip()
            
            return json.loads(result_text)
            
        except Exception as e:
            logger.error(f"OpenAI extraction error: {str(e)}")
            return {"error": str(e), "raw_text": prompt[:500]}
    
    def process_document(self, file_path: str, document_type: str) -> Dict[str, Any]:
        """Main method to process a document end-to-end"""
        try:
            # Step 1: Extract text
            text = self.extract_text(file_path)
            
            if not text or len(text) < 20:
                return {"error": "Could not extract sufficient text from document"}
            
            # Step 2: Extract structured data based on type
            if document_type == "invoice":
                data = self.extract_invoice_data(text)
            elif document_type == "contract":
                data = self.extract_contract_data(text)
            elif document_type == "bank_statement":
                data = self.extract_bank_statement_data(text)
            else:
                data = {"raw_text": text[:1000]}
            
            data["_raw_text_preview"] = text[:500]
            return data
            
        except Exception as e:
            logger.error(f"Document processing error: {str(e)}")
            return {"error": str(e)}
