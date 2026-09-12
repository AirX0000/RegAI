import csv
import io
from typing import Any, List
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta

from app.core.deps import get_db, get_current_active_user
from app.db.models.audit_log import AuditLog
from app.db.models.user import User

router = APIRouter()

@router.get("")
@router.get("/")
def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    user_id: str = Query(None),
    action: str = Query(None),
    start_date: str = Query(None),
    end_date: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get audit logs with optional filters.
    Only accessible to admin/owner users.
    Company admins see only actions inside their company.
    Master SuperAdmins see all actions across all companies.
    """
    # Check if user has permission (admin or owner role)
    allowed_roles = ["admin", "owner", "company_owner", "superadmin", "website_superadmin", "company_admin", "company_superadmin"]
    if current_user.role not in allowed_roles and not getattr(current_user, "is_superuser", False):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    query = db.query(AuditLog)
    if not (getattr(current_user, "is_superuser", False) or current_user.role in ["superadmin", "website_superadmin"]):
        if getattr(current_user, "company_id", None):
            company_user_ids = db.query(User.id).filter(User.company_id == current_user.company_id).subquery()
            query = query.filter(
                (AuditLog.tenant_id == current_user.tenant_id) &
                ((AuditLog.user_id.in_(company_user_ids)) | (AuditLog.user_id.is_(None)))
            )
        else:
            query = query.filter(AuditLog.tenant_id == current_user.tenant_id)
    
    # Apply filters
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    
    if action:
        query = query.filter(AuditLog.action == action)
    
    if start_date:
        try:
            start = datetime.fromisoformat(start_date)
            query = query.filter(AuditLog.timestamp >= start)
        except ValueError:
            pass
    
    if end_date:
        try:
            end = datetime.fromisoformat(end_date)
            query = query.filter(AuditLog.timestamp <= end)
        except ValueError:
            pass
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    logs = query.order_by(desc(AuditLog.timestamp)).offset(skip).limit(limit).all()
    
    # Format response
    results = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first() if log.user_id else None
        results.append({
            "id": str(log.id),
            "user_email": user.email if user else "System",
            "user_name": user.full_name if user else "System",
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": str(log.resource_id) if log.resource_id else None,
            "details": log.details,
            "timestamp": log.timestamp.isoformat() if log.timestamp else (log.created_at.isoformat() if log.created_at else None),
            "ip_address": log.ip_address
        })
    
    return {
        "total": total,
        "logs": results,
        "skip": skip,
        "limit": limit
    }

@router.get("/stats")
def get_audit_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get audit log statistics for the dashboard.
    """
    allowed_roles = ["admin", "owner", "superadmin", "company_admin", "company_superadmin", "company_owner", "website_superadmin"]
    if current_user.role not in allowed_roles and not getattr(current_user, "is_superuser", False):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Get today's date
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    
    # Get logs from last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    query = db.query(AuditLog)
    if not (getattr(current_user, "is_superuser", False) or current_user.role in ["superadmin", "website_superadmin"]):
        if getattr(current_user, "company_id", None):
            company_user_ids = db.query(User.id).filter(User.company_id == current_user.company_id).subquery()
            query = query.filter(
                (AuditLog.tenant_id == current_user.tenant_id) &
                ((AuditLog.user_id.in_(company_user_ids)) | (AuditLog.user_id.is_(None)))
            )
        else:
            query = query.filter(AuditLog.tenant_id == current_user.tenant_id)
    
    total_actions = query.count()
    
    # Today's actions
    today_actions = query.filter(AuditLog.timestamp >= today_start).count()
    
    # Active users (users who performed actions in last 24 hours)
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    users_q = db.query(AuditLog.user_id).filter(
        AuditLog.timestamp >= twenty_four_hours_ago,
        AuditLog.user_id.isnot(None)
    )
    if not (getattr(current_user, "is_superuser", False) or current_user.role in ["superadmin", "website_superadmin"]):
        if getattr(current_user, "company_id", None):
            company_user_ids = db.query(User.id).filter(User.company_id == current_user.company_id).subquery()
            users_q = users_q.filter(
                (AuditLog.tenant_id == current_user.tenant_id) &
                (AuditLog.user_id.in_(company_user_ids))
            )
        else:
            users_q = users_q.filter(AuditLog.tenant_id == current_user.tenant_id)
    active_users = users_q.distinct().count()
    
    # Critical actions (delete, permission changes)
    critical_actions = query.filter(
        AuditLog.action.in_(['delete', 'permission_change', 'role_change']),
        AuditLog.timestamp >= thirty_days_ago
    ).count()
    
    return {
        "total_actions": total_actions,
        "today_actions": today_actions,
        "active_users": active_users,
        "critical_actions": critical_actions
    }

@router.get("/export")
def export_audit_logs(
    action: str = Query(None),
    user_id: str = Query(None),
    start_date: str = Query(None),
    end_date: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Export audit logs to downloadable CSV.
    """
    allowed_roles = ["admin", "owner", "company_owner", "superadmin", "website_superadmin", "company_admin", "company_superadmin"]
    if current_user.role not in allowed_roles and not getattr(current_user, "is_superuser", False):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    query = db.query(AuditLog)
    if not (getattr(current_user, "is_superuser", False) or current_user.role in ["superadmin", "website_superadmin"]):
        if getattr(current_user, "company_id", None):
            company_user_ids = db.query(User.id).filter(User.company_id == current_user.company_id).subquery()
            query = query.filter(
                (AuditLog.tenant_id == current_user.tenant_id) &
                ((AuditLog.user_id.in_(company_user_ids)) | (AuditLog.user_id.is_(None)))
            )
        else:
            query = query.filter(AuditLog.tenant_id == current_user.tenant_id)
            
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if start_date:
        try:
            start = datetime.fromisoformat(start_date)
            query = query.filter(AuditLog.timestamp >= start)
        except ValueError:
            pass
    if end_date:
        try:
            end = datetime.fromisoformat(end_date)
            query = query.filter(AuditLog.timestamp <= end)
        except ValueError:
            pass

    logs = query.order_by(desc(AuditLog.timestamp)).limit(1000).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Timestamp", "User Email", "User Name", "Action", "Resource Type", "Resource ID", "IP Address", "Details"])
    for log in logs:
        u = db.query(User).filter(User.id == log.user_id).first() if log.user_id else None
        ts = log.timestamp.isoformat() if log.timestamp else (log.created_at.isoformat() if log.created_at else "")
        writer.writerow([
            str(log.id),
            ts,
            u.email if u else "System",
            u.full_name if u else "System",
            log.action or "",
            log.resource_type or "",
            str(log.resource_id) if log.resource_id else "",
            log.ip_address or "",
            log.details or ""
        ])
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8-sig')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=audit-logs-{datetime.utcnow().date()}.csv"}
    )
