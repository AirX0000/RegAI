import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, func, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base

class ReviewNote(Base):
    __tablename__ = "review_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("reports.id"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    note_text = Column(Text, nullable=False)
    section_reference = Column(String(500))  # Reference to specific section in report
    is_resolved = Column(Boolean, default=False)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    resolution_text = Column(Text, nullable=True)
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    report = relationship("Report")
    creator = relationship("User", foreign_keys=[created_by])
    resolver = relationship("User", foreign_keys=[resolved_by])
    tenant = relationship("Tenant")
