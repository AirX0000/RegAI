from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pathlib import Path
import shutil
import json
from datetime import datetime

from app.core.deps import get_db, get_current_active_user
from app.db.models.document import Document, DocumentType, DocumentStatus
from app.services.document_extraction_service import DocumentExtractionService

router = APIRouter()

UPLOAD_DIR = Path("uploads/documents")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_document(
    *,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
    file: UploadFile = File(...),
    document_type: str = Form(...),
) -> Any:
    """
    Upload a document and trigger extraction.
    """
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must be associated with a company")
    
    # Validate document type
    try:
        doc_type = DocumentType(document_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid document type. Must be one of: {[t.value for t in DocumentType]}")
    
    # Validate file extension
    allowed_extensions = {'.pdf', '.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"File type {file_ext} not supported. Allowed: {allowed_extensions}")
    
    # Save file
    file_path = UPLOAD_DIR / f"{current_user.company_id}_{datetime.now().timestamp()}_{file.filename}"
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Create database record
    document = Document(
        company_id=current_user.company_id,
        uploaded_by=current_user.id,
        filename=file.filename,
        file_path=str(file_path),
        document_type=doc_type,
        status=DocumentStatus.PENDING
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    
    # Trigger extraction asynchronously (in background)
    try:
        document.status = DocumentStatus.PROCESSING
        db.commit()
        
        extraction_service = DocumentExtractionService()
        extracted_data = extraction_service.process_document(str(file_path), document_type)
        
        if "error" in extracted_data:
            document.status = DocumentStatus.ERROR
            document.error_message = extracted_data["error"]
        else:
            document.status = DocumentStatus.COMPLETED
            document.extracted_data = json.dumps(extracted_data)
            document.processed_at = datetime.now()
        
        db.commit()
        db.refresh(document)
        
    except Exception as e:
        document.status = DocumentStatus.ERROR
        document.error_message = str(e)
        db.commit()
    
    return {
        "id": str(document.id),
        "filename": document.filename,
        "document_type": document.document_type.value,
        "status": document.status.value,
        "extracted_data": json.loads(document.extracted_data) if document.extracted_data else None,
        "error_message": document.error_message,
        "created_at": document.created_at,
        "processed_at": document.processed_at
    }

@router.get("")
def list_documents(
    *,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 50,
) -> Any:
    """
    List all documents for the current user's company.
    """
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must be associated with a company")
    
    documents = db.query(Document).filter(
        Document.company_id == current_user.company_id
    ).order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
    
    return [
        {
            "id": str(doc.id),
            "filename": doc.filename,
            "document_type": doc.document_type.value,
            "status": doc.status.value,
            "created_at": doc.created_at,
            "processed_at": doc.processed_at
        }
        for doc in documents
    ]

@router.get("/{document_id}")
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Get a specific document with extracted data.
    """
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.company_id == current_user.company_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "id": str(document.id),
        "filename": document.filename,
        "document_type": document.document_type.value,
        "status": document.status.value,
        "extracted_data": json.loads(document.extracted_data) if document.extracted_data else None,
        "error_message": document.error_message,
        "created_at": document.created_at,
        "processed_at": document.processed_at
    }

@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Delete a document.
    """
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.company_id == current_user.company_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file
    try:
        Path(document.file_path).unlink(missing_ok=True)
    except Exception as e:
        # Log but don't fail if file deletion fails
        pass
    
    db.delete(document)
    db.commit()
    
    return {"message": "Document deleted successfully"}
