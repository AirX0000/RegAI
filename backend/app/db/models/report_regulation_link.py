import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, func, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base

class ReportRegulationLink(Base):
    __tablename__ = "report_regulation_links"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("reports.id"), nullable=False)
    regulation_id = Column(UUID(as_uuid=True), ForeignKey("regulations.id"), nullable=False)
    
    # Section reference in the report
    section_text = Column(Text)
    section_page = Column(Integer, nullable=True)
    section_reference = Column(String(500))
    
    # Notes about the mapping
    mapping_notes = Column(Text)
    
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    report = relationship("Report")
    regulation = relationship("Regulation")
    creator = relationship("User")
    tenant = relationship("Tenant")
