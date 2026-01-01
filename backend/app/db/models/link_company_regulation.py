import uuid
from sqlalchemy import Column, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

class LinkCompanyRegulation(Base):
    __tablename__ = "link_company_regulation"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    regulation_id = Column(UUID(as_uuid=True), ForeignKey("regulations.id"), nullable=False)
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
