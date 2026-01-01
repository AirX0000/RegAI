import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, func, Text, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True, nullable=False, unique=True)
    domain = Column(String, index=True)
    
    # Profile fields
    description = Column(Text)
    logo_url = Column(String(500))
    website = Column(String(255))
    industry = Column(String(100), index=True)
    employee_count = Column(Integer)
    is_active = Column(Boolean, default=True, index=True)
    
    # Ownership tracking
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)  # Company owner
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # Who created this company
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    tenant = relationship("Tenant")
    users = relationship("User", foreign_keys="User.company_id", back_populates="company")
    owner = relationship("User", foreign_keys="[Company.owner_id]", post_update=True)
    created_by = relationship("User", foreign_keys="[Company.created_by_id]", post_update=True)
    balance_sheets = relationship("BalanceSheet", back_populates="company")
