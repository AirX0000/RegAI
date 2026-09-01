from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_active_user
from app.db.models.user import User
from app.services.notification_service import NotificationService
from pydantic import BaseModel

router = APIRouter()


class Notification(BaseModel):
    id: str
    title: str
    message: str
    type: str
    link: str | None
    read: bool
    created_at: str


@router.get("/", response_model=List[Notification])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get current user's notifications (from database)."""
    return NotificationService.get_user_notifications(db, current_user.id)


@router.post("/{notification_id}/read")
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Mark a notification as read."""
    NotificationService.mark_as_read(db, notification_id, current_user.id)
    return {"status": "success"}


@router.post("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Mark all user notifications as read."""
    count = NotificationService.mark_all_read(db, current_user.id)
    return {"status": "success", "marked_read": count}
