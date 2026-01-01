from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timezone

from app.db.session import Base

class ReportTemplate(Base):
    __tablename__ = "report_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    report_type = Column(String(50), nullable=False)  # compliance, audit, financial, risk_assessment
    
    # Template configuration
    country_code = Column(String(10))  # For tax analysis
    tax_types = Column(JSON)  # List of tax types to check
    
    # Recurring settings
    is_recurring = Column(Boolean, default=False)
    recurrence_pattern = Column(String(50))  # monthly, quarterly, yearly
    
    # Ownership
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    creator = relationship("User", backref="report_templates")
    company = relationship("Company", backref="report_templates")
    tenant = relationship("Tenant", backref="report_templates")
