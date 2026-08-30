from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

# --- Connection Schemas ---

class OneCConnectionBase(BaseModel):
    url: str = Field(..., description="1C OData standard endpoint URL, e.g. http://1c-server/base/odata/standard.odata/")
    auth_type: str = Field("basic", description="Authentication type: 'basic' or 'token'")
    username: Optional[str] = Field(None, description="Username for Basic Auth")
    company_code: Optional[str] = Field(None, description="Organization code, GUID or Tax ID in 1C")
    verify_ssl: bool = Field(True, description="Whether to verify SSL certificates")

class OneCConnectionCreate(OneCConnectionBase):
    password: Optional[str] = Field(None, description="Plaintext password for Basic Auth (will be encrypted)")
    api_token: Optional[str] = Field(None, description="Plaintext token/API key (will be encrypted)")

class OneCConnectionUpdate(BaseModel):
    url: Optional[str] = None
    auth_type: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    api_token: Optional[str] = None
    company_code: Optional[str] = None
    verify_ssl: Optional[bool] = None

class OneCConnectionResponse(OneCConnectionBase):
    id: uuid.UUID
    company_id: uuid.UUID
    status: str = Field("disconnected", description="connected, disconnected, error")
    last_sync: Optional[datetime] = None
    last_latency_ms: Optional[int] = None
    last_error: Optional[str] = None
    has_password: bool = False
    has_token: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class OneCTestRequest(BaseModel):
    url: str
    auth_type: str = "basic"
    username: Optional[str] = None
    password: Optional[str] = None
    api_token: Optional[str] = None
    company_code: Optional[str] = None
    verify_ssl: bool = True

class OneCTestResponse(BaseModel):
    success: bool
    message: str
    status: str
    latency_ms: Optional[int] = None
    metadata_summary: Optional[Dict[str, Any]] = None

# --- Ingestion Schemas (1C -> RegAI) ---

class TrialBalanceFilterRequest(BaseModel):
    period_start: Optional[datetime] = Field(None, description="Start date for trial balance turnover period")
    period_end: Optional[datetime] = Field(None, description="End date (cut-off) for balance calculation")
    company_code: Optional[str] = Field(None, description="Override organization code for query")
    account_filter: Optional[List[str]] = Field(None, description="Optional list of specific account codes to filter")
    auto_populate_balance_sheet: bool = Field(True, description="Whether to auto-create or update RegAI Balance Sheet")
    notes: Optional[str] = Field(None, description="Notes to attach to the generated balance sheet")

class TrialBalanceLine(BaseModel):
    account_code: str
    account_name: str
    category: Optional[str] = Field(None, description="'assets', 'liabilities', or 'equity'")
    subcategory: Optional[str] = Field(None, description="e.g. 'Current Assets', 'Non-Current Assets', etc.")
    debit_opening: float = 0.0
    credit_opening: float = 0.0
    debit_turnover: float = 0.0
    credit_turnover: float = 0.0
    debit_closing: float = 0.0
    credit_closing: float = 0.0
    net_closing_balance: float = 0.0
    currency: str = "RUB"
    subconto_data: Optional[Dict[str, Any]] = None

class TrialBalanceResponse(BaseModel):
    success: bool
    balance_sheet_id: Optional[uuid.UUID] = None
    period: datetime
    total_accounts: int
    total_assets: float
    total_liabilities: float
    total_equity: float
    is_balanced: bool
    lines: List[TrialBalanceLine]
    sync_log_id: Optional[uuid.UUID] = None
    is_mock: bool = False
    message: str

# --- Export / Pushback Schemas (RegAI -> 1C) ---

class ExportAdjustmentsRequest(BaseModel):
    balance_sheet_id: uuid.UUID
    adjustment_ids: Optional[List[uuid.UUID]] = Field(None, description="Optional subset of adjustment IDs to export")
    document_date: Optional[datetime] = Field(None, description="Date for 1C accounting operation document")
    document_comment: Optional[str] = Field("IFRS Adjustment Entry from RegAI", description="Header comment in 1C")

class ExportAdjustmentsResponse(BaseModel):
    success: bool
    document_number_1c: Optional[str] = None
    document_guid_1c: Optional[str] = None
    exported_adjustments_count: int
    total_amount: float
    sync_log_id: Optional[uuid.UUID] = None
    message: str
    is_mock: bool = False

# --- Audit & Log Schemas ---

class OneCSyncLogResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    sync_type: str
    status: str
    records_processed: int
    duration_ms: int
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    error_details: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
