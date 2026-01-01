from typing import Optional
from datetime import datetime
from pydantic import BaseModel, UUID4

class ReportBase(BaseModel):
    title: str
    description: Optional[str] = None
    report_type: str  # compliance, audit, financial, risk_assessment

class ReportCreate(ReportBase):
    company_id: UUID4

class ReportUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    report_type: Optional[str] = None

class ReportReview(BaseModel):
    status: str  # approved, rejected
    reviewer_comments: Optional[str] = None

class Report(ReportBase):
    id: UUID4
    status: str
    submitted_by: UUID4
    reviewed_by: Optional[UUID4] = None
    company_id: UUID4
    tenant_id: UUID4
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    reviewer_comments: Optional[str] = None

    class Config:
        from_attributes = True
