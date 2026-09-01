import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy import Uuid as UUID
from app.db.session import Base


class Notification(Base):
    """
    Persistent user notification record.
    Replaces the previous in-memory MOCK_NOTIFICATIONS global list.
    """
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(20), nullable=False, default="info")  # info | success | warning | error
    link = Column(String(512), nullable=True)
    read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
