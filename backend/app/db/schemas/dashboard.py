from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class WidgetConfig(BaseModel):
    id: str  # e.g. "compliance-score", "one-c-sync"
    enabled: bool = True
    order: int = 0
    settings: Optional[Dict[str, Any]] = {}

class DashboardLayout(BaseModel):
    widgets: List[WidgetConfig] = []

class ComplianceData(BaseModel):
    score: int
    status: str
    pending_tasks: int

class OneCStatus(BaseModel):
    connected: bool
    last_sync: Optional[str] = None
    errors: int = 0

class TransformationStats(BaseModel):
    total_processed: int
    saved_hours: float

class DashboardData(BaseModel):
    compliance: Optional[ComplianceData] = None
    one_c_status: Optional[OneCStatus] = None
    transformation: Optional[TransformationStats] = None
    recent_activity: List[Dict[str, Any]] = []
