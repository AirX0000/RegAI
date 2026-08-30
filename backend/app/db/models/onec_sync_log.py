import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Integer, Text, JSON, func
from sqlalchemy import Uuid as UUID
from app.db.session import Base

class OneCSyncLog(Base):
    __tablename__ = "onec_sync_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), nullable=True)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    
    sync_type = Column(String(50), nullable=False)  # "sync_trial_balance", "export_adjustments", "test_connection"
    status = Column(String(50), nullable=False)  # "SUCCESS", "PARTIAL", "FAILED"
    records_processed = Column(Integer, default=0, nullable=False)
    duration_ms = Column(Integer, default=0, nullable=False)
    
    period_start = Column(DateTime, nullable=True)
    period_end = Column(DateTime, nullable=True)
    
    request_payload = Column(JSON, nullable=True)
    response_summary = Column(JSON, nullable=True)
    error_details = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
