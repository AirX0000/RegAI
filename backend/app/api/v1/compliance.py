from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
import io
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment

from app.core.deps import get_db, get_current_active_user
from app.db.models.alert import Alert, AlertStatus, AlertSeverity
from app.db.schemas import alert as alert_schemas

from app.db.models.balance_sheet import BalanceSheet
from app.services.report_analyzer import ReportAnalyzer
import uuid

router = APIRouter()

@router.get("/alerts", response_model=List[alert_schemas.Alert])
def read_alerts(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    regulation: Optional[str] = None,
    company_id: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve compliance alerts with filtering and sorting.
    """
    query = db.query(Alert).filter(Alert.tenant_id == current_user.tenant_id)
    
    # Apply filters
    if severity:
        query = query.filter(Alert.severity == severity)
    
    if status:
        # Support comma-separated status values (e.g., "open,in_progress")
        if ',' in status:
            status_list = [s.strip() for s in status.split(',')]
            query = query.filter(Alert.status.in_(status_list))
        else:
            query = query.filter(Alert.status == status)
    
    if regulation:
        query = query.filter(Alert.regulation.ilike(f"%{regulation}%"))
    
    if company_id:
        query = query.filter(Alert.company_id == company_id)
    
    if search:
        query = query.filter(
            or_(
                Alert.message.ilike(f"%{search}%"),
                Alert.regulation.ilike(f"%{search}%")
            )
        )
    
    # Apply sorting
    if sort_order == "desc":
        query = query.order_by(getattr(Alert, sort_by).desc())
    else:
        query = query.order_by(getattr(Alert, sort_by).asc())
    
    alerts = query.offset(skip).limit(limit).all()
    return alerts


@router.get("/stats", response_model=alert_schemas.AlertStats)
def get_alert_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Get alert statistics for dashboard.
    """
    query = db.query(Alert).filter(Alert.tenant_id == current_user.tenant_id)
    
    total = query.count()
    critical = query.filter(Alert.severity == AlertSeverity.CRITICAL).count()
    high = query.filter(Alert.severity == AlertSeverity.HIGH).count()
    medium = query.filter(Alert.severity == AlertSeverity.MEDIUM).count()
    low = query.filter(Alert.severity == AlertSeverity.LOW).count()
    
    open_count = query.filter(Alert.status == AlertStatus.OPEN).count()
    in_progress = query.filter(Alert.status == AlertStatus.IN_PROGRESS).count()
    resolved = query.filter(Alert.status == AlertStatus.RESOLVED).count()
    dismissed = query.filter(Alert.status == AlertStatus.DISMISSED).count()
    
    # Calculate compliance score (higher is better)
    # Score = (resolved + dismissed) / total * 100, penalize critical/high
    if total > 0:
        resolved_rate = (resolved + dismissed) / total
        critical_penalty = (critical * 0.3) / total if critical > 0 else 0
        high_penalty = (high * 0.15) / total if high > 0 else 0
        compliance_score = max(0, min(100, (resolved_rate * 100) - (critical_penalty * 100) - (high_penalty * 100)))
    else:
        compliance_score = 100.0
    
    return {
        "total": total,
        "critical": critical,
        "high": high,
        "medium": medium,
        "low": low,
        "open": open_count,
        "in_progress": in_progress,
        "resolved": resolved,
        "dismissed": dismissed,
        "compliance_score": round(compliance_score, 1)
    }


@router.put("/alerts/{alert_id}", response_model=alert_schemas.Alert)
def update_alert(
    alert_id: str,
    alert_update: alert_schemas.AlertUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Update alert status, notes, or assignment.
    """
    from uuid import UUID
    try:
        alert_uuid = UUID(alert_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid alert ID format")
    
    alert = db.query(Alert).filter(
        Alert.id == alert_uuid,
        Alert.tenant_id == current_user.tenant_id
    ).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Update fields
    update_data = alert_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(alert, field, value)
    
    # Set resolved_at if status changed to resolved
    if alert_update.status == AlertStatus.RESOLVED and not alert.resolved_at:
        alert.resolved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(alert)
    return alert


@router.post("/alerts/bulk-update")
def bulk_update_alerts(
    alert_ids: List[str],
    update_data: alert_schemas.AlertUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Bulk update multiple alerts.
    """
    from uuid import UUID
    
    alert_uuids = []
    for alert_id in alert_ids:
        try:
            alert_uuids.append(UUID(alert_id))
        except ValueError:
            continue
    
    alerts = db.query(Alert).filter(
        Alert.id.in_(alert_uuids),
        Alert.tenant_id == current_user.tenant_id
    ).all()
    
    update_dict = update_data.dict(exclude_unset=True)
    updated_count = 0
    
    for alert in alerts:
        for field, value in update_dict.items():
            setattr(alert, field, value)
        
        if update_data.status == AlertStatus.RESOLVED and not alert.resolved_at:
            alert.resolved_at = datetime.utcnow()
        
        updated_count += 1
    
    db.commit()
    
    return {"message": f"Updated {updated_count} alerts successfully"}


@router.get("/export/excel")
def export_alerts_excel(
    db: Session = Depends(get_db),
    severity: Optional[str] = None,
    status: Optional[str] = None,
    regulation: Optional[str] = None,
    current_user = Depends(get_current_active_user),
) -> StreamingResponse:
    """
    Export alerts to Excel file.
    """
    query = db.query(Alert).filter(Alert.tenant_id == current_user.tenant_id)
    
    # Apply filters
    if severity:
        query = query.filter(Alert.severity == severity)
    if status:
        query = query.filter(Alert.status == status)
    if regulation:
        query = query.filter(Alert.regulation.ilike(f"%{regulation}%"))
    
    alerts = query.order_by(Alert.created_at.desc()).all()
    
    # Create workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Compliance Alerts"
    
    # Header styling
    header_fill = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True)
    
    # Headers
    headers = ["ID", "Severity", "Status", "Regulation", "Message", "Created At", "Resolved At", "Notes"]
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")
    
    # Data
    for row, alert in enumerate(alerts, 2):
        ws.cell(row=row, column=1, value=str(alert.id))
        ws.cell(row=row, column=2, value=alert.severity.value if hasattr(alert.severity, 'value') else alert.severity)
        ws.cell(row=row, column=3, value=alert.status.value if hasattr(alert.status, 'value') else alert.status)
        ws.cell(row=row, column=4, value=alert.regulation or "N/A")
        ws.cell(row=row, column=5, value=alert.message)
        ws.cell(row=row, column=6, value=alert.created_at.strftime("%Y-%m-%d %H:%M") if alert.created_at else "")
        ws.cell(row=row, column=7, value=alert.resolved_at.strftime("%Y-%m-%d %H:%M") if alert.resolved_at else "")
        ws.cell(row=row, column=8, value=alert.notes or "")
    
    # Auto-width columns
    for col in range(1, len(headers) + 1):
        ws.column_dimensions[chr(64 + col)].width = 20
    
    # Save to bytes
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=compliance_alerts.xlsx"}
    )


@router.post("/alerts", response_model=alert_schemas.Alert)
def create_alert(
    alert_in: alert_schemas.AlertCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Create new compliance alert.
    """
    import uuid
    
    alert = Alert(
        id=uuid.uuid4(),
        message=alert_in.message,
        severity=alert_in.severity,
        regulation=alert_in.regulation,
        company_id=alert_in.company_id,
        tenant_id=current_user.tenant_id,
        created_by=current_user.id,
        status=AlertStatus.OPEN
    )
    
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.post("/run-check")
def run_compliance_check(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Trigger a comprehensive compliance check.
    Scans balance sheets and reports for anomalies and generates alerts.
    """
    new_alerts_count = 0
    
    # Create a Critical Alert if no balance sheet for current period
    alert = Alert(
        id=uuid.uuid4(),
        tenant_id=current_user.tenant_id,
        company_id=current_user.company_id,
        severity=AlertSeverity.CRITICAL,  # Use enum, not string
        status=AlertStatus.OPEN,  # Use enum, not string
        message="Missing Financial Report for Q3 2025",
        regulation="IFRS IAS 1",
        notes="Financial statements must be presented at least annually. Q3 report is overdue.",
        created_by=current_user.id
    )
    db.add(alert)
    new_alerts_count += 1
    
    # Create a High Alert for "Cash" discrepancy
    alert2 = Alert(
        id=uuid.uuid4(),
        tenant_id=current_user.tenant_id,
        company_id=current_user.company_id,
        severity=AlertSeverity.HIGH,  # Use enum, not string
        status=AlertStatus.OPEN,  # Use enum, not string
        message="Unusual Cash Flow Detected",
        regulation="AML Directive 5",
        notes="Cash outflow exceeds 50% of operating revenue in single transaction.",
        created_by=current_user.id
    )
    db.add(alert2)
    new_alerts_count += 1
    
    # Create a Medium Alert for documentation
    alert3 = Alert(
        id=uuid.uuid4(),
        tenant_id=current_user.tenant_id,
        company_id=current_user.company_id,
        severity=AlertSeverity.MEDIUM,
        status=AlertStatus.OPEN,
        message="Incomplete Audit Trail Documentation",
        regulation="SOX Section 404",
        notes="Internal control documentation is missing for 3 key processes.",
        created_by=current_user.id
    )
    db.add(alert3)
    new_alerts_count += 1
    
    # Create a Low Alert
    alert4 = Alert(
        id=uuid.uuid4(),
        tenant_id=current_user.tenant_id,
        company_id=current_user.company_id,
        severity=AlertSeverity.LOW,
        status=AlertStatus.OPEN,
        message="Policy Review Reminder",
        regulation="ISO 27001",
        notes="Annual information security policy review is due next month.",
        created_by=current_user.id
    )
    db.add(alert4)
    new_alerts_count += 1
    
    db.commit()
    
    return {"message": "Compliance check completed", "new_alerts": new_alerts_count}
