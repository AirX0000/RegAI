from typing import List, Dict, Any
from datetime import datetime, timezone
import uuid

# In-memory store for mock notifications
# In production, this would be in the database
MOCK_NOTIFICATIONS: List[Dict[str, Any]] = []

class NotificationService:
    @staticmethod
    def create_notification(
        user_id: uuid.UUID,
        title: str,
        message: str,
        type: str = "info", # info, success, warning, error
        link: str = None
    ):
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": str(user_id),
            "title": title,
            "message": message,
            "type": type,
            "link": link,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        MOCK_NOTIFICATIONS.insert(0, notification)
        
        # Keep only last 100
        if len(MOCK_NOTIFICATIONS) > 100:
            MOCK_NOTIFICATIONS.pop()
            
        return notification

    @staticmethod
    def get_user_notifications(user_id: uuid.UUID, limit: int = 10):
        return [n for n in MOCK_NOTIFICATIONS if n["user_id"] == str(user_id)][:limit]

    @staticmethod
    def mark_as_read(notification_id: str):
        for n in MOCK_NOTIFICATIONS:
            if n["id"] == notification_id:
                n["read"] = True
                break
