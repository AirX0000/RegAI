from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime
from enum import Enum

class AlertStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"

class AlertSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

# Shared properties
class AlertBase(BaseModel):
    message: str
    severity: AlertSeverity = AlertSeverity.MEDIUM
    regulation: Optional[str] = None
    company_id: Optional[UUID4] = None

# Properties to receive on alert creation
class AlertCreate(AlertBase):
    pass

# Properties to receive on alert update
class AlertUpdate(BaseModel):
    status: Optional[AlertStatus] = None
    notes: Optional[str] = None
    resolution_notes: Optional[str] = None
    assigned_to: Optional[UUID4] = None

# Properties shared by models stored in DB
class AlertInDBBase(AlertBase):
    id: UUID4
    status: AlertStatus
    notes: Optional[str] = None
    resolution_notes: Optional[str] = None
    tenant_id: UUID4
    created_by: Optional[UUID4] = None
    assigned_to: Optional[UUID4] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Properties to return to client
class Alert(AlertInDBBase):
    pass

# Statistics response
class AlertStats(BaseModel):
    total: int
    critical: int
    high: int
    medium: int
    low: int
    open: int
    in_progress: int
    resolved: int
    dismissed: int
    compliance_score: float  # 0-100
