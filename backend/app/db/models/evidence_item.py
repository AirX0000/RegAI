import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, func, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base

class EvidenceItem(Base):
    __tablename__ = "evidence_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    source_type = Column(String(100))  # 'report_analysis', 'regulation', 'alert', etc.
    source_id = Column(UUID(as_uuid=True))  # ID of the source item
    content_snapshot = Column(Text)  # Snapshot of relevant content
    
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    creator = relationship("User")
    tenant = relationship("Tenant")
