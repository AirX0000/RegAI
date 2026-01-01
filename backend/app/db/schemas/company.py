from typing import Optional
from pydantic import BaseModel, UUID4
from datetime import datetime

# Shared properties
class CompanyBase(BaseModel):
    name: str
    domain: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    employee_count: Optional[int] = None

# Properties to receive on company creation
class CompanyCreate(CompanyBase):
    pass

# Properties to receive on company update
class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    employee_count: Optional[int] = None
    is_active: Optional[bool] = None

# Properties shared by models stored in DB
class CompanyInDBBase(CompanyBase):
    id: UUID4
    tenant_id: UUID4
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Properties to return to client
class Company(CompanyInDBBase):
    pass

# Properties for company profile
class CompanyProfile(BaseModel):
    id: UUID4
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    employee_count: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
