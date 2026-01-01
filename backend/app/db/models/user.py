import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, func, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, index=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    role = Column(String, default="user") # website_superadmin, company_owner, company_superadmin, company_admin, auditor, accountant
    
    # Hierarchy fields
    hierarchy_level = Column(Integer, default=5, index=True)  # 1=Website SuperAdmin, 2=Company Owner, 3=Company SuperAdmin, 4=Company Admin, 5=User
    is_company_owner = Column(Boolean, default=False, index=True)
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=True, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    preferences = Column(JSON, default={})
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tenant = relationship("Tenant")
    company = relationship("Company", foreign_keys=[company_id], back_populates="users")
