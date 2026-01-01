from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import datetime

class ReportTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    report_type: str
    country_code: Optional[str] = None
    tax_types: Optional[List[str]] = None
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None

class ReportTemplateCreate(ReportTemplateBase):
    pass

class ReportTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    report_type: Optional[str] = None
    country_code: Optional[str] = None
    tax_types: Optional[List[str]] = None
    is_recurring: Optional[bool] = None
    recurrence_pattern: Optional[str] = None

class ReportTemplate(ReportTemplateBase):
    id: UUID4
    created_by: UUID4
    company_id: UUID4
    tenant_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
