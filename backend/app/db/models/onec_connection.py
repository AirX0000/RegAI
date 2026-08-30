import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean, Integer, Text, func
from sqlalchemy import Uuid as UUID
from app.db.session import Base
from app.core.crypto import encrypt_secret, decrypt_secret

class OneCConnection(Base):
    __tablename__ = "onec_connections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, unique=True)
    
    url = Column(String(500), nullable=False)
    auth_type = Column(String(50), default="basic", nullable=False)  # "basic" or "token"
    username = Column(String(255), nullable=True)
    password = Column(Text, nullable=True)  # Fernet Encrypted
    api_token = Column(Text, nullable=True)  # Fernet Encrypted
    company_code = Column(String(100), nullable=True)  # 1C Organization code / GUID
    verify_ssl = Column(Boolean, default=True, nullable=False)
    
    status = Column(String(50), default="disconnected")  # connected, disconnected, error
    last_sync = Column(DateTime(timezone=True), nullable=True)
    last_latency_ms = Column(Integer, nullable=True)
    last_error = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def set_password(self, plain_password: str):
        self.password = encrypt_secret(plain_password)

    def get_password(self) -> str:
        return decrypt_secret(self.password)

    def set_api_token(self, plain_token: str):
        self.api_token = encrypt_secret(plain_token)

    def get_api_token(self) -> str:
        return decrypt_secret(self.api_token)
