from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from uuid import UUID
from enum import Enum


class BalanceSheetStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    TRANSFORMED = "transformed"


class BalanceSheetCategory(str, Enum):
    ASSETS = "assets"
    LIABILITIES = "liabilities"
    EQUITY = "equity"


class TransformationFormat(str, Enum):
    MCFO = "mcfo"
    IFRS = "ifrs"


# Balance Sheet Item Schemas
class BalanceSheetItemBase(BaseModel):
    account_code: str = Field(..., max_length=50)
    account_name: str = Field(..., max_length=255)
    amount: Decimal
    category: BalanceSheetCategory
    subcategory: Optional[str] = Field(None, max_length=100)


class BalanceSheetItemCreate(BalanceSheetItemBase):
    pass


class BalanceSheetItemUpdate(BaseModel):
    account_code: Optional[str] = Field(None, max_length=50)
    account_name: Optional[str] = Field(None, max_length=255)
    amount: Optional[Decimal] = None
    category: Optional[BalanceSheetCategory] = None
    subcategory: Optional[str] = Field(None, max_length=100)


class BalanceSheetItem(BalanceSheetItemBase):
    id: UUID
    balance_sheet_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# Balance Sheet Schemas
class BalanceSheetBase(BaseModel):
    period: datetime
    notes: Optional[str] = None


class BalanceSheetCreate(BalanceSheetBase):
    items: List[BalanceSheetItemCreate] = []


class BalanceSheetUpdate(BaseModel):
    period: Optional[datetime] = None
    status: Optional[BalanceSheetStatus] = None
    notes: Optional[str] = None


class BalanceSheet(BalanceSheetBase):
    id: UUID
    company_id: UUID
    status: BalanceSheetStatus
    created_at: datetime
    updated_at: datetime
    items: List[BalanceSheetItem] = []

    class Config:
        from_attributes = True


# Transformed Statement Schemas
class TransformedStatementBase(BaseModel):
    format_type: TransformationFormat
    transformed_data: dict
    transformation_rules_applied: Optional[dict] = None


class TransformedStatementCreate(TransformedStatementBase):
    balance_sheet_id: UUID


class TransformedStatement(TransformedStatementBase):
    id: UUID
    balance_sheet_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# Transformation Request/Response
class TransformationRequest(BaseModel):
    balance_sheet_id: UUID


class TransformationResponse(BaseModel):
    balance_sheet_id: UUID
    mcfo_statement: Optional[TransformedStatement] = None
    ifrs_statement: Optional[TransformedStatement] = None
    success: bool
    message: str


# Adjustment Schemas
class TransformationAdjustmentBase(BaseModel):
    description: str = Field(..., max_length=255)
    adjustment_amount: Decimal
    adjustment_type: str = Field(..., pattern="^(debit|credit)$")
    ifrs_category: Optional[str] = Field(None, max_length=100)
    balance_sheet_item_id: Optional[UUID] = None


class TransformationAdjustmentCreate(TransformationAdjustmentBase):
    pass


class TransformationAdjustment(TransformationAdjustmentBase):
    id: UUID
    balance_sheet_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# Update BalanceSheet to include adjustments
class BalanceSheet(BalanceSheetBase):
    id: UUID
    company_id: UUID
    status: BalanceSheetStatus
    created_at: datetime
    updated_at: datetime
    items: List[BalanceSheetItem] = []
    adjustments: List[TransformationAdjustment] = []

    class Config:
        from_attributes = True
