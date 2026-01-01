from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.core.deps import get_db, get_current_active_user
from app.db.models.user import User
from app.db.schemas.dashboard import (
    DashboardLayout, 
    DashboardData, 
    ComplianceData, 
    OneCStatus, 
    TransformationStats,
    WidgetConfig
)

router = APIRouter()

DEFAULT_LAYOUT = [
    {"id": "compliance-score", "enabled": True, "order": 0, "settings": {}},
    {"id": "one-c-sync", "enabled": True, "order": 1, "settings": {}},
    {"id": "transformation-stats", "enabled": True, "order": 2, "settings": {}},
    {"id": "quick-actions", "enabled": True, "order": 3, "settings": {}},
    {"id": "recent-activity", "enabled": True, "order": 4, "settings": {}},
]

@router.get("/config", response_model=DashboardLayout)
def get_dashboard_config(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get the user's personalized dashboard configuration.
    Returns default layout if no preferences set.
    """
    prefs = current_user.preferences or {}
    layout_data = prefs.get("dashboard_layout", [])
    
    if not layout_data:
        # Return default layout
        layout_objects = [WidgetConfig(**w) for w in DEFAULT_LAYOUT]
    else:
        layout_objects = [WidgetConfig(**w) for w in layout_data]
        
    return DashboardLayout(widgets=layout_objects)

@router.post("/config", response_model=DashboardLayout)
def update_dashboard_config(
    config: DashboardLayout,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Save the user's personalized dashboard configuration.
    """
    # Ensure preferences dict exists
    prefs = dict(current_user.preferences or {})
    
    # Update layout
    prefs["dashboard_layout"] = [w.dict() for w in config.widgets]
    
    current_user.preferences = prefs
    
    # Explicitly flag as modified for SQLAlchemy to detect JSON change
    flag_modified(current_user, "preferences")
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return config

@router.get("/data", response_model=DashboardData)
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get real-time data for dashboard widgets.
    Currently returns mocked data for the 'Intelligence Layer' MVP.
    """
    
    # 1. Compliance Data (Mocked based on strategy)
    compliance = ComplianceData(
        score=87,
        status="Good",
        pending_tasks=3
    )
    
    # 2. 1C Integration Status (Mocked)
    one_c = OneCStatus(
        connected=True,
        last_sync="2 minutes ago",
        errors=0
    )
    
    # 3. Transformation Stats (Mocked or Could be Real count)
    # real_count = db.query(BalanceSheet).filter(...).count()
    transformation = TransformationStats(
        total_processed=142,
        saved_hours=320.5 # Calculated: 142 * 2.25 hours avg saving
    )
    
    # 4. Recent Activity (Mocked for MVP, can connect to AuditLog later)
    recent = [
        {"id": "1", "action": "Report Generated", "timestamp": "2025-01-01T10:00:00Z", "details": "Q4 Financials"},
        {"id": "2", "action": "Compliance Alert", "timestamp": "2025-01-01T09:45:00Z", "details": "New Tax Regulation"},
        {"id": "3", "action": "User Login", "timestamp": "2025-01-01T09:00:00Z", "details": "Admin"},
        {"id": "4", "action": "1C Sync", "timestamp": "2025-01-01T08:30:00Z", "details": "Data synchronization complete"},
    ]
    
    return DashboardData(
        compliance=compliance,
        one_c_status=one_c,
        transformation=transformation,
        recent_activity=recent
    )
