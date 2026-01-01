from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class TenantBase(BaseModel):
    name: str
    plan: Optional[str] = "free"

class TenantCreate(TenantBase):
    pass

class TenantUpdate(TenantBase):
    name: Optional[str] = None
    plan: Optional[str] = None
    is_active: Optional[bool] = None

class TenantInDBBase(TenantBase):
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class Tenant(TenantInDBBase):
    pass
