from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.core.deps import get_db, get_current_active_user
from app.api.v1.reports import can_user_access_report
from app.db.models.report_comment import ReportComment
from app.db.models.report import Report
from app.db.models.user import User
from app.db.schemas import report_comment as comment_schemas

router = APIRouter()


@router.post("/{report_id}/comments", response_model=comment_schemas.ReportComment)
def add_comment(
    report_id: str,
    comment_in: comment_schemas.ReportCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Add comment to report (strict tenant and company isolation).
    """
    report = db.query(Report).filter(Report.id == uuid.UUID(report_id)).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if not can_user_access_report(current_user, report):
        raise HTTPException(status_code=403, detail="Not authorized")

    comment = ReportComment(
        id=uuid.uuid4(),
        report_id=uuid.UUID(report_id),
        user_id=current_user.id,
        comment=comment_in.comment,
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    result = comment_schemas.ReportComment.from_orm(comment)
    result.user_email = current_user.email

    return result


@router.get("/{report_id}/comments", response_model=List[comment_schemas.ReportComment])
def get_comments(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get all comments for a report (strict tenant and company isolation, batch user lookup).
    """
    report = db.query(Report).filter(Report.id == uuid.UUID(report_id)).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if not can_user_access_report(current_user, report):
        raise HTTPException(status_code=403, detail="Not authorized")

    comments = db.query(ReportComment).filter(
        ReportComment.report_id == uuid.UUID(report_id)
    ).order_by(ReportComment.created_at.asc()).all()

    # Batch-fetch user emails to avoid N+1 queries
    user_ids = list({c.user_id for c in comments if c.user_id})
    users_by_id = {}
    if user_ids:
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        users_by_id = {u.id: u.email for u in users}

    results = []
    for comment in comments:
        result = comment_schemas.ReportComment.from_orm(comment)
        result.user_email = users_by_id.get(comment.user_id, "Unknown")
        results.append(result)

    return results


@router.delete("/{report_id}/comments/{comment_id}")
def delete_comment(
    report_id: str,
    comment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Delete a comment (only comment owner, same-company admin, or superadmin).
    Prevents Cross-Tenant / Cross-Company BOLA (IDOR).
    """
    report = db.query(Report).filter(Report.id == uuid.UUID(report_id)).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    comment = db.query(ReportComment).filter(
        ReportComment.id == uuid.UUID(comment_id),
        ReportComment.report_id == report.id
    ).first()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Enforce strict tenant & company isolation first
    if not can_user_access_report(current_user, report):
        raise HTTPException(status_code=403, detail="Not authorized")

    is_super = getattr(current_user, "is_superuser", False) or current_user.role in ["superadmin", "website_superadmin"]
    is_same_company_admin = (
        current_user.role in ["admin", "company_admin", "company_owner", "company_superadmin"]
        and report.company_id is not None
        and report.company_id == current_user.company_id
    )
    if comment.user_id != current_user.id and not (is_super or is_same_company_admin):
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted"}
