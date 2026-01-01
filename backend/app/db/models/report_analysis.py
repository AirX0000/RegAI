from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.session import Base

class ReportAnalysis(Base):
    __tablename__ = "report_analyses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    report_id = Column(UUID(as_uuid=True), ForeignKey("reports.id"), nullable=False)
    country_code = Column(String(2), nullable=False)
    tax_types = Column(JSON)  # List of tax types to check
    status = Column(String(50), default="pending")  # pending, processing, completed, failed
    overall_score = Column(Integer)  # 0-100
    
    # Analysis results
    total_checks = Column(Integer, default=0)
    passed_checks = Column(Integer, default=0)
    warnings = Column(Integer, default=0)
    errors = Column(Integer, default=0)
    
    # Detailed results stored as JSON
    error_details = Column(JSON)  # List of error objects
    summary = Column(Text)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    report = relationship("Report", backref="analyses")
