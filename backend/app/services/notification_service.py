"""
Persistent notification service backed by the database.
Replaces the previous in-memory MOCK_NOTIFICATIONS global list.
"""
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        user_id: uuid.UUID,
        title: str,
        message: str,
        type: str = "info",
        link: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Persist a notification to the database and return it as a dict."""
        from app.db.models.notification import Notification

        notification = Notification(
            id=uuid.uuid4(),
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            link=link,
            read=False,
            created_at=datetime.now(timezone.utc),
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return _to_dict(notification)

    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: uuid.UUID,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """Return the most recent notifications for a user."""
        from app.db.models.notification import Notification

        rows = (
            db.query(Notification)
            .filter(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
            .all()
        )
        return [_to_dict(n) for n in rows]

    @staticmethod
    def mark_as_read(db: Session, notification_id: str, user_id: uuid.UUID) -> bool:
        """Mark a notification as read. Returns True if found, False otherwise."""
        from app.db.models.notification import Notification

        try:
            nid = uuid.UUID(notification_id)
        except ValueError:
            return False

        n = (
            db.query(Notification)
            .filter(Notification.id == nid, Notification.user_id == user_id)
            .first()
        )
        if not n:
            return False
        n.read = True
        db.commit()
        return True

    @staticmethod
    def mark_all_read(db: Session, user_id: uuid.UUID) -> int:
        """Mark all unread notifications for a user as read. Returns count."""
        from app.db.models.notification import Notification
        from sqlalchemy import update

        result = (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.read == False)
            .update({"read": True})
        )
        db.commit()
        return result


def _to_dict(n) -> Dict[str, Any]:
    return {
        "id": str(n.id),
        "user_id": str(n.user_id),
        "title": n.title,
        "message": n.message,
        "type": n.type,
        "link": n.link,
        "read": n.read,
        "created_at": (
            n.created_at.isoformat()
            if n.created_at
            else datetime.now(timezone.utc).isoformat()
        ),
    }
