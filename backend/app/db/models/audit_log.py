import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, func, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    action = Column(String, nullable=False)
    resource_type = Column(String)  # e.g., "report", "user", "company"
    resource_id = Column(String)    # ID of the affected resource
    details = Column(Text)          # Additional details about the action
    
    ip_address = Column(String)
    user_agent = Column(String)
    success = Column(Boolean, default=True)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Keep created_at as alias for backward compatibility
    created_at = Column(DateTime(timezone=True), server_default=func.now())
