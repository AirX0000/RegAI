from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, UUID4

class ErrorDetail(BaseModel):
    severity: str  # critical, warning, info
    type: str  # incorrect_rate, missing_field, calculation_error
    location: str  # Page, line, cell reference
    expected: Optional[Any] = None
    found: Optional[Any] = None
    impact: Optional[float] = None
    currency: Optional[str] = None
    recommendation: str

class AnalysisRequest(BaseModel):
    report_id: UUID4
    country_code: str
    tax_types: List[str]  # ['vat', 'corporate', etc.]

class ReportAnalysisBase(BaseModel):
    report_id: UUID4
    country_code: str
    tax_types: List[str]

class ReportAnalysisCreate(ReportAnalysisBase):
    pass

class ReportAnalysis(ReportAnalysisBase):
    id: UUID4
    status: str
    overall_score: Optional[int] = None
    total_checks: int
    passed_checks: int
    warnings: int
    errors: int
    error_details: Optional[List[Dict[str, Any]]] = None
    summary: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
