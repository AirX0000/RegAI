import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, func, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum

class AlertStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"

class AlertSeverity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message = Column(Text, nullable=False)
    severity = Column(SQLEnum(AlertSeverity), nullable=False, default=AlertSeverity.MEDIUM, index=True)
    status = Column(SQLEnum(AlertStatus), nullable=False, default=AlertStatus.OPEN, index=True)
    regulation = Column(String(100), index=True)  # e.g., "GDPR", "CCPA", "HIPAA"
    notes = Column(Text)
    resolution_notes = Column(Text)
    
    # Relationships
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    company = relationship("Company")
    tenant = relationship("Tenant")
    creator = relationship("User", foreign_keys=[created_by])
    assignee = relationship("User", foreign_keys=[assigned_to])
