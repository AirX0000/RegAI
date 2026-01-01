import uuid
from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime, func, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

class RegulationImpact(Base):
    __tablename__ = "regulation_impacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    regulation_id = Column(UUID(as_uuid=True), ForeignKey("regulations.id"), nullable=False, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)
    
    impact_score = Column(Integer) # 1-10 scale
    summary = Column(Text) # AI generated summary of impact
    action_items = Column(JSON) # List of strings
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
