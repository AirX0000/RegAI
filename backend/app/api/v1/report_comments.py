from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.core.deps import get_db, get_current_active_user
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
    Add comment to report
    """
    # Get report
    report = db.query(Report).filter(Report.id == uuid.UUID(report_id)).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check permissions - can comment if:
    # 1. Report owner
    # 2. Admin of same company
    # 3. Superadmin
    if current_user.role == "superadmin":
        pass
    elif current_user.role == "admin":
        if report.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    else:
        if report.submitted_by != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    # Create comment
    comment = ReportComment(
        id=uuid.uuid4(),
        report_id=uuid.UUID(report_id),
        user_id=current_user.id,
        comment=comment_in.comment,
    )
    
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    # Add user email to response
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
    Get all comments for a report
    """
    # Get report
    report = db.query(Report).filter(Report.id == uuid.UUID(report_id)).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check permissions
    if current_user.role == "superadmin":
        pass
    elif current_user.role == "admin":
        if report.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    else:
        if report.submitted_by != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get comments
    comments = db.query(ReportComment).filter(
        ReportComment.report_id == uuid.UUID(report_id)
    ).order_by(ReportComment.created_at.asc()).all()
    
    # Add user emails
    results = []
    for comment in comments:
        user = db.query(User).filter(User.id == comment.user_id).first()
        result = comment_schemas.ReportComment.from_orm(comment)
        result.user_email = user.email if user else "Unknown"
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
    Delete a comment (only comment owner or admin)
    """
    comment = db.query(ReportComment).filter(
        ReportComment.id == uuid.UUID(comment_id),
        ReportComment.report_id == uuid.UUID(report_id)
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check permissions
    if comment.user_id != current_user.id and current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted"}
