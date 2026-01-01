from typing import Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta

from app.core.deps import get_db, get_current_active_user
from app.db.models.audit_log import AuditLog
from app.db.models.user import User

router = APIRouter()

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
    """
    # Check if user has permission (admin or owner role)
    if current_user.role not in ["admin", "owner", "superadmin"]:
        return {"error": "Insufficient permissions"}, 403
    
    query = db.query(AuditLog).filter(
        AuditLog.tenant_id == current_user.tenant_id
    )
    
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
        user = db.query(User).filter(User.id == log.user_id).first()
        results.append({
            "id": str(log.id),
            "user_email": user.email if user else "Unknown",
            "user_name": user.full_name if user else "Unknown",
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": str(log.resource_id) if log.resource_id else None,
            "details": log.details,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
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
    if current_user.role not in ["admin", "owner", "superadmin", "company_admin", "company_superadmin", "company_owner"]:
        return {"error": "Insufficient permissions"}, 403
    
    # Get today's date
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    
    # Get logs from last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    query = db.query(AuditLog).filter(
        AuditLog.tenant_id == current_user.tenant_id
    )
    
    total_actions = query.count()
    
    # Today's actions
    today_actions = query.filter(AuditLog.timestamp >= today_start).count()
    
    # Active users (users who performed actions in last 24 hours)
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    active_users = db.query(AuditLog.user_id).filter(
        AuditLog.tenant_id == current_user.tenant_id,
        AuditLog.timestamp >= twenty_four_hours_ago,
        AuditLog.user_id.isnot(None)
    ).distinct().count()
    
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
