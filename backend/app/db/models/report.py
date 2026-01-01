from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.session import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    report_type = Column(String(50), nullable=False)  # compliance, audit, financial, risk_assessment
    status = Column(String(50), default="draft")  # draft, submitted, under_review, approved, rejected
    
    # Relationships
    submitted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    # File information
    file_path = Column(String(500))
    file_name = Column(String(255))
    file_size = Column(Integer)
    
    # Timestamps
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Review comments
    reviewer_comments = Column(Text)
    
    # Relationships
    submitter = relationship("User", foreign_keys=[submitted_by], backref="submitted_reports")
    reviewer = relationship("User", foreign_keys=[reviewed_by], backref="reviewed_reports")
    company = relationship("Company", backref="reports")
    tenant = relationship("Tenant", backref="reports")
