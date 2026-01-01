from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta, timezone

from app.core.deps import get_db, get_current_active_user
from app.db.models.report import Report
from app.db.models.report_analysis import ReportAnalysis
from app.db.models.user import User

router = APIRouter()

@router.get("/personal")
def get_personal_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get personal analytics for accountant/auditor dashboard
    """
    # Base query depends on role
    if current_user.role == "superadmin":
        base_query = db.query(Report)
    elif current_user.role == "admin":
        base_query = db.query(Report).filter(Report.company_id == current_user.company_id)
    else:  # accountant, auditor
        base_query = db.query(Report).filter(Report.submitted_by == current_user.id)
    
    # Total reports
    total_reports = base_query.count()
    
    # Status breakdown
    status_counts = {}
    for status in ["draft", "submitted", "under_review", "approved", "rejected"]:
        count = base_query.filter(Report.status == status).count()
        status_counts[status] = count
    
    # This month stats
    month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month = base_query.filter(Report.created_at >= month_start).count()
    
    # Average compliance score
    analyses = db.query(ReportAnalysis).join(Report).filter(
        Report.submitted_by == current_user.id if current_user.role not in ["admin", "superadmin"] else True
    ).all()
    
    avg_score = 0
    if analyses:
        scores = [a.overall_score for a in analyses if a.overall_score is not None]
        avg_score = sum(scores) / len(scores) if scores else 0
    
    # Action items
    action_items = []
    
    # Pending reviews (for admins)
    if current_user.role in ["admin", "superadmin"]:
        pending = db.query(Report).filter(
            Report.status == "submitted",
            Report.company_id == current_user.company_id if current_user.role == "admin" else True
        ).limit(5).all()
        
        for report in pending:
            action_items.append({
                "type": "review_needed",
                "report_id": str(report.id),
                "title": report.title,
                "message": f"Review needed: {report.title}",
                "priority": "high"
            })
    
    # Reports with errors (for accountants)
    if current_user.role in ["accountant", "auditor"]:
        error_reports = db.query(Report).join(ReportAnalysis).filter(
            Report.submitted_by == current_user.id,
            ReportAnalysis.errors > 0
        ).limit(5).all()
        
        for report in error_reports:
            analysis = db.query(ReportAnalysis).filter(
                ReportAnalysis.report_id == report.id
            ).first()
            
            action_items.append({
                "type": "errors_found",
                "report_id": str(report.id),
                "title": report.title,
                "message": f"{analysis.errors} error(s) found in {report.title}",
                "priority": "critical"
            })
    
    # Rejected reports
    rejected = base_query.filter(Report.status == "rejected").limit(5).all()
    for report in rejected:
        action_items.append({
            "type": "rejected",
            "report_id": str(report.id),
            "title": report.title,
            "message": f"Resubmit: {report.title}",
            "priority": "medium"
        })
    
    # Compliance trend (last 6 months)
    trends = []
    for i in range(6):
        month_date = datetime.now(timezone.utc) - timedelta(days=30 * i)
        month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
        
        month_analyses = db.query(ReportAnalysis).join(Report).filter(
            Report.submitted_by == current_user.id if current_user.role not in ["admin", "superadmin"] else True,
            ReportAnalysis.created_at >= month_start,
            ReportAnalysis.created_at <= month_end
        ).all()
        
        if month_analyses:
            scores = [a.overall_score for a in month_analyses if a.overall_score is not None]
            avg = sum(scores) / len(scores) if scores else 0
        else:
            avg = 0
        
        trends.append({
            "month": month_date.strftime("%b %Y"),
            "score": round(avg, 1),
            "count": len(month_analyses)
        })
    
    trends.reverse()  # Oldest to newest
    
    return {
        "total_reports": total_reports,
        "this_month": this_month,
        "status_breakdown": status_counts,
        "avg_compliance_score": round(avg_score, 1),
        "action_items": action_items[:10],  # Limit to 10
        "compliance_trends": trends,
        "user_role": current_user.role
    }


@router.get("/company-stats")
def get_company_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get company-wide statistics (admin only)
    """
    if current_user.role not in ["admin", "superadmin"]:
        return {"error": "Unauthorized"}
    
    company_id = current_user.company_id
    
    # Total reports in company
    total = db.query(Report).filter(Report.company_id == company_id).count()
    
    # By user
    user_stats = db.query(
        Report.submitted_by,
        func.count(Report.id).label('count')
    ).filter(
        Report.company_id == company_id
    ).group_by(Report.submitted_by).all()
    
    return {
        "total_reports": total,
        "users": [{"user_id": str(u[0]), "count": u[1]} for u in user_stats]
    }
