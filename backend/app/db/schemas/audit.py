from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AuditLogBase(BaseModel):
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    success: bool = True

class AuditLogCreate(AuditLogBase):
    tenant_id: UUID
    user_id: Optional[UUID] = None

class AuditLog(AuditLogBase):
    id: UUID
    tenant_id: UUID
    user_id: Optional[UUID] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
