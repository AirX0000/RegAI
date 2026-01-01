from typing import Any, List
from fastapi import APIRouter, Depends
from app.core.deps import get_current_active_user
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
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get current user's notifications
    """
    return NotificationService.get_user_notifications(current_user.id)

@router.post("/{notification_id}/read")
def mark_read(
    notification_id: str,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Mark notification as read
    """
    NotificationService.mark_as_read(notification_id)
    return {"status": "success"}
