import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, func, Text, Numeric, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum

class BalanceSheetStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    TRANSFORMED = "transformed"

class BalanceSheetCategory(str, enum.Enum):
    ASSETS = "assets"
    LIABILITIES = "liabilities"
    EQUITY = "equity"

class TransformationFormat(str, enum.Enum):
    MCFO = "mcfo"
    IFRS = "ifrs"

class BalanceSheet(Base):
    __tablename__ = "balance_sheets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    period = Column(DateTime, nullable=False)  # Reporting period
    status = Column(Enum(BalanceSheetStatus), default=BalanceSheetStatus.DRAFT, nullable=False)
    notes = Column(Text, nullable=True)  # Additional notes
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    items = relationship("BalanceSheetItem", back_populates="balance_sheet", cascade="all, delete-orphan")
    transformations = relationship("TransformationAdjustment", back_populates="balance_sheet")
    transformed_statements = relationship("TransformedStatement", back_populates="balance_sheet", cascade="all, delete-orphan")
    company = relationship("Company", back_populates="balance_sheets")

class BalanceSheetItem(Base):
    __tablename__ = "balance_sheet_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    balance_sheet_id = Column(UUID(as_uuid=True), ForeignKey("balance_sheets.id"), nullable=False)
    account_code = Column(String, nullable=True)
    account_name = Column(String, nullable=False)
    amount = Column(Numeric(precision=15, scale=2), nullable=False)
    category = Column(Enum(BalanceSheetCategory), nullable=True)
    subcategory = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    balance_sheet = relationship("BalanceSheet", back_populates="items")

class TransformedStatement(Base):
    __tablename__ = "transformed_statements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    balance_sheet_id = Column(UUID(as_uuid=True), ForeignKey("balance_sheets.id"), nullable=False)
    format_type = Column(Enum(TransformationFormat), nullable=False)
    transformed_data = Column(JSON, nullable=False)
    transformation_rules_applied = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    balance_sheet = relationship("BalanceSheet", back_populates="transformed_statements")

class TransformationAdjustment(Base):
    __tablename__ = "transformation_adjustments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    balance_sheet_id = Column(UUID(as_uuid=True), ForeignKey("balance_sheets.id"), nullable=False)
    description = Column(String(255), nullable=False)
    adjustment_amount = Column(Numeric(precision=15, scale=2), nullable=False)
    adjustment_type = Column(String(10), nullable=False)  # debit or credit
    ifrs_category = Column(String(100), nullable=True)
    balance_sheet_item_id = Column(UUID(as_uuid=True), ForeignKey("balance_sheet_items.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    balance_sheet = relationship("BalanceSheet", back_populates="transformations")
    balance_sheet_item = relationship("BalanceSheetItem")
