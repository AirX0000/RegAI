from sqlalchemy import Column, String, Numeric, Date, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
import uuid

from app.db.session import Base

class TaxRate(Base):
    __tablename__ = "tax_rates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    country_code = Column(String(2), nullable=False, index=True)  # ISO 3166-1 alpha-2
    country_name = Column(String(100), nullable=False)
    tax_type = Column(String(50), nullable=False, index=True)  # vat, corporate, income, withholding, payroll
    rate = Column(Numeric(10, 4), nullable=False)  # e.g., 20.0000 for 20%
    description = Column(Text)
    effective_from = Column(Date, nullable=False)
    effective_to = Column(Date, nullable=True)  # NULL means currently active
    source_url = Column(String(500))
    last_updated = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
