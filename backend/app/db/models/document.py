import uuid
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, func, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base
import enum

class DocumentType(str, enum.Enum):
    INVOICE = "invoice"
    CONTRACT = "contract"
    BANK_STATEMENT = "bank_statement"
    OTHER = "other"

class DocumentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    ERROR = "error"

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    document_type = Column(SQLEnum(DocumentType), nullable=False)
    status = Column(SQLEnum(DocumentStatus), default=DocumentStatus.PENDING, nullable=False)
    
    # Extracted data stored as JSON text
    extracted_data = Column(Text, nullable=True)  # JSON string
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
