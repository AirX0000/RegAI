from pydantic import BaseModel, UUID4
from datetime import datetime

class ReportCommentBase(BaseModel):
    comment: str

class ReportCommentCreate(ReportCommentBase):
    pass

class ReportComment(ReportCommentBase):
    id: UUID4
    report_id: UUID4
    user_id: UUID4
    created_at: datetime
    user_email: str = ""  # Will be populated from relationship

    class Config:
        from_attributes = True
