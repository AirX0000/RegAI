from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class RegulationBase(BaseModel):
    code: str
    title: str
    jurisdiction: Optional[str] = None
    category: Optional[str] = None
    source_url: Optional[str] = None
    effective_date: Optional[datetime] = None

class RegulationCreate(RegulationBase):
    content: str # Content is needed for ingestion but not stored directly in DB (stored in Chroma)

class RegulationUpdate(RegulationBase):
    pass

class RegulationInDBBase(RegulationBase):
    id: UUID
    content_hash: Optional[str] = None
    tenant_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class Regulation(RegulationInDBBase):
    pass

class RegulationSearchResults(BaseModel):
    results: List[Regulation]
    total: int
