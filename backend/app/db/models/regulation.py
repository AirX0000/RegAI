import uuid
from sqlalchemy import Column, String, Text, DateTime, func, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSON
from app.db.session import Base

class Regulation(Base):
    __tablename__ = "regulations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String, index=True, nullable=False) # e.g. "IFRS-9"
    title = Column(String, index=True, nullable=False)
    jurisdiction = Column(String, index=True)
    category = Column(String, index=True) # Tax, IFRS, ESG, Privacy, Security
    content = Column(Text) # Detailed regulation content
    workflow_steps = Column(JSON) # Detailed workflow procedures and checklists
    content_hash = Column(String, index=True) # For deduplication
    source_url = Column(String)
    effective_date = Column(DateTime(timezone=True))
    
    # Regulations might be global (system) or tenant-specific (internal policies)
    # If tenant_id is NULL, it's a global regulation visible to all
    tenant_id = Column(UUID(as_uuid=True), index=True, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
