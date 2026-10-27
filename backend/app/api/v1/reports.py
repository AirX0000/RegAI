from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid
import os
import re
import json
import shutil
import io

from app.core.deps import get_db, get_current_active_user
from app.db.models.report import Report
from app.db.models.user import User
from app.db.models.audit_log import AuditLog
from app.db.schemas import report as report_schemas
from app.services.notification_service import NotificationService

router = APIRouter()

UPLOAD_DIR = "uploads/reports"
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".csv", ".txt"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
FORMULA_TRIGGERS = ("=", "+", "-", "@", "\t", "\r")


def sanitize_excel_cell(value: Any) -> str:
    """Prevent CSV/Excel Formula Injection (CWE-1236) by escaping dangerous leading characters."""
    if value is None:
        return ""
    text = str(value)
    if text.startswith(FORMULA_TRIGGERS):
        return f"'{text}"
    return text


def sanitize_filename(filename: Optional[str], fallback: str = "report.pdf") -> str:
    """Strip path traversal, CRLF, quotes, and control chars to prevent Content-Disposition Header Injection."""
    if not filename:
        return fallback
    base = os.path.basename(filename)
    # Remove CR, LF, quotes, backslashes, and control characters
    cleaned = re.sub(r'[\r\n"\\<>|:*?\x00-\x1f]', "_", base).strip()
    return cleaned or fallback


def validate_file_magic_bytes(file_ext: str, header_bytes: bytes) -> None:
    """Validate file content signature (Magic Bytes) against declared extension to block spoofing."""
    if not header_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    if file_ext == ".pdf":
        if not header_bytes.startswith(b"%PDF-"):
            raise HTTPException(
                status_code=400,
                detail="Invalid PDF file signature (magic bytes mismatch)"
            )
    elif file_ext in {".xlsx", ".docx"}:
        # Office Open XML (.xlsx, .docx) are ZIP archives starting with PK\x03\x04
        if not header_bytes.startswith(b"PK\x03\x04"):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid {file_ext} file signature (expected Office Open XML container)"
            )
    elif file_ext in {".csv", ".txt"}:
        # Block binary executables or HTML/script payloads disguised as text/csv
        if b"\x00" in header_bytes or header_bytes.startswith((b"MZ", b"\x7fELF")):
            raise HTTPException(
                status_code=400,
                detail=f"Binary or executable content is not allowed in {file_ext} files"
            )
        lower_sample = header_bytes[:512].lstrip().lower()
        if lower_sample.startswith((b"<!doctype html", b"<html", b"<script")):
            raise HTTPException(
                status_code=400,
                detail=f"HTML/Script payloads are not allowed in {file_ext} files"
            )


def _log_audit_event(
    db: Session,
    user: User,
    action: str,
    resource_id: str,
    details: dict[str, Any],
    request: Optional[Request] = None,
) -> None:
    """Record security-sensitive report actions in AuditLog with IP and JSON details."""
    tenant_id = getattr(user, "tenant_id", None)
    if not tenant_id:
        return
    try:
        ip_addr = request.client.host if (request and request.client) else "unknown"
        user_agent = request.headers.get("user-agent", "") if request else ""
        log_entry = AuditLog(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            user_id=user.id,
            action=action,
            resource_type="report",
            resource_id=str(resource_id),
            details=json.dumps(details, ensure_ascii=False),
            ip_address=ip_addr,
            user_agent=user_agent,
            success=True,
        )
        db.add(log_entry)
        db.commit()
    except Exception:
        db.rollback()


def can_user_access_report(user: User, report: Report) -> bool:
    """Centralized strict authorization check for report access (deny-by-default)."""
    if getattr(user, "is_superuser", False) or user.role in ["superadmin", "website_superadmin"]:
        return True
    # Cross-tenant isolation
    if report.tenant_id and user.tenant_id and report.tenant_id != user.tenant_id:
        return False
    # Cross-company isolation
    if report.company_id and user.company_id and report.company_id != user.company_id:
        return False
    # Submitter always has access to their report
    if report.submitted_by == user.id:
        return True
    # Company admins/owners/superadmins can access reports in their company
    if user.role in ["admin", "company_admin", "company_owner", "company_superadmin"]:
        return report.company_id == user.company_id
    # Auditors in the same company can access reports
    if user.role == "auditor" and report.company_id == user.company_id:
        return True
    # Deny by default for any other role
    return False


def save_upload_file(upload_file: UploadFile, company_id: Any, report_id: Any) -> tuple:
    """Save uploaded file with extension, magic-byte, and size validation."""
    safe_original_name = sanitize_filename(upload_file.filename, fallback="report.txt")
    file_ext = os.path.splitext(safe_original_name)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {file_ext} not allowed. Allowed: {ALLOWED_EXTENSIONS}")

    # Read header bytes for magic-byte verification
    header_bytes = upload_file.file.read(2048)
    upload_file.file.seek(0)
    validate_file_magic_bytes(file_ext, header_bytes)

    # Create directory
    report_dir = os.path.join(UPLOAD_DIR, str(company_id), str(report_id))
    os.makedirs(report_dir, exist_ok=True)

    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(report_dir, unique_filename)

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    # Get file size
    file_size = os.path.getsize(file_path)

    if file_size > MAX_FILE_SIZE:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"File size exceeds {MAX_FILE_SIZE / 1024 / 1024}MB limit")

    return file_path, safe_original_name, file_size


@router.post("/", response_model=report_schemas.Report)
async def create_report(
    *,
    request: Request,
    db: Session = Depends(get_db),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    report_type: str = Form(...),
    company_id: str = Form(...),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create a new report (accountant/auditor only).
    """
    # Check if user is accountant or auditor
    if current_user.role not in ["accountant", "auditor", "admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Only accountants and auditors can create reports")
    
    target_company_id = uuid.UUID(company_id)
    if not (current_user.role in ["superadmin", "website_superadmin"] or getattr(current_user, "is_superuser", False)):
        if not current_user.company_id or current_user.company_id != target_company_id:
            raise HTTPException(status_code=403, detail="Cannot create reports for another company")

    # Create report
    report_id = uuid.uuid4()
    report = Report(
        id=report_id,
        title=title,
        description=description,
        report_type=report_type,
        status="draft",
        submitted_by=current_user.id,
        company_id=target_company_id,
        tenant_id=current_user.tenant_id,
    )
    
    # Handle file upload if provided
    if file:
        file_path, file_name, file_size = save_upload_file(file, company_id, report_id)
        report.file_path = file_path
        report.file_name = file_name
        report.file_size = file_size
    
    db.add(report)
    db.commit()
    db.refresh(report)

    _log_audit_event(
        db=db,
        user=current_user,
        action="report_created",
        resource_id=str(report.id),
        details={"title": report.title, "report_type": report.report_type, "file_name": report.file_name},
        request=request,
    )
    
    # Notify admins of new report
    NotificationService.create_notification(
        db=db,
        user_id=current_user.id,
        title="Report Submitted",
        message=f"Your report '{report.title}' has been submitted successfully.",
        type="success",
        link=f"/reports/{report.id}"
    )
    
    return report


@router.get("/", response_model=List[report_schemas.Report])
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    status: Optional[str] = None,
) -> Any:
    """
    List reports. Accountants/auditors see own reports, admins see company reports.
    """
    query = db.query(Report)
    
    # Filter based on role
    if current_user.role in ["superadmin", "website_superadmin"] or current_user.is_superuser:
        # Global superadmins see all reports
        pass
    elif current_user.role in ["accountant", "auditor", "user"]:
        # Accountants/auditors only see their own reports
        query = query.filter(Report.submitted_by == current_user.id)
    else:
        # Company admins/owners only see reports for their own company
        if not current_user.company_id:
            return []
        query = query.filter(Report.company_id == current_user.company_id)
    
    # Filter by status if provided
    if status:
        query = query.filter(Report.status == status)
    
    return query.order_by(Report.created_at.desc()).all()


@router.get("/{report_id}", response_model=report_schemas.Report)
def get_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get report details.
    """
    report = db.query(Report).filter(Report.id == uuid.UUID(report_id)).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check permissions (strict deny-by-default)
    if not can_user_access_report(current_user, report):
        raise HTTPException(status_code=403, detail="Not authorized to view this report")
    
    return report


@router.post("/{report_id}/submit", response_model=report_schemas.Report)
def submit_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Submit a draft report.
    """
    report = db.query(Report).filter(Report.id == uuid.UUID(report_id)).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check ownership
    if report.submitted_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to submit this report")
    
    # Check if already submitted
    if report.status != "draft":
        raise HTTPException(status_code=400, detail="Report already submitted")
    
    # Update status
    report.status = "submitted"
    report.submitted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(report)
    return report


@router.post("/{report_id}/review", response_model=report_schemas.Report)
def review_report(
    report_id: str,
    review: report_schemas.ReportReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Review a report (admin only).
    """
    # Check if user has review authority (Segregation of Duties: Owner, Auditor, Admin, Superadmin)
    if current_user.role not in ["admin", "superadmin", "company_owner", "auditor", "website_superadmin"]:
        raise HTTPException(status_code=403, detail="Only authorized reviewers (Owner, Auditor, Admin) can review reports")
    
    report = db.query(Report).filter(Report.id == uuid.UUID(report_id)).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check if admin is from same company
    if not (current_user.role in ["superadmin", "website_superadmin"] or current_user.is_superuser):
        if report.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="Not authorized to review reports of another company")
    
    report.reviewed_by = current_user.id
    report.reviewed_at = datetime.now(timezone.utc)
    report.reviewer_comments = review.reviewer_comments
    db.commit()
    db.refresh(report)
    
    # Notify submitter
    NotificationService.create_notification(
        db=db,
        user_id=report.submitted_by,
        title=f"Report {review.status.title()}",
        message=f"Your report '{report.title}' has been {review.status}.",
        type="success" if review.status == "approved" else "error",
        link=f"/reports/{report.id}"
    )
    
    return report


@router.post("/{report_id}/validate", response_model=report_schemas.Report)
def validate_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Trigger validation (AI analysis + convergence check) for a report.
    """
    report = db.query(Report).filter(Report.id == uuid.UUID(report_id)).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check permissions (strict deny-by-default)
    if not can_user_access_report(current_user, report):
        raise HTTPException(status_code=403, detail="Not authorized to validate this report")
            
    if not report.file_path or not os.path.exists(report.file_path):
        raise HTTPException(status_code=400, detail="No file attached to report")
        
    # Run analysis
    from app.services.report_analyzer import ReportAnalyzer
    analyzer = ReportAnalyzer(db)
    
    # Determine country code (from company or default)
    # Ideally we get this from company, but for now defaulting to 'US' or extracting from report if possible
    # We'll use 'US' as default for this example
    country_code = "US" 
    
    try:
        analysis = analyzer.analyze_report(
            report_id=report.id,
            file_path=report.file_path,
            country_code=country_code,
            tax_types=['vat', 'corporate'] 
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


@router.post("/{report_id}/antigravity-audit")
async def run_antigravity_security_audit(
    report_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Run Autonomous Security & IFRS Compliance Audit powered by Google Antigravity SDK.
    """
    report = db.query(Report).filter(Report.id == uuid.UUID(report_id)).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if not can_user_access_report(current_user, report):
        raise HTTPException(status_code=403, detail="Not authorized to audit this report")

    from app.services.antigravity_auditor import AxiarisAntigravityAuditor

    excerpt = f"{report.title or ''}\n{report.description or ''}"
    if report.file_path and os.path.exists(report.file_path):
        try:
            with open(report.file_path, "r", encoding="utf-8", errors="ignore") as f:
                excerpt += "\n" + f.read(2000)
        except Exception:
            pass

    auditor = AxiarisAntigravityAuditor()
    audit_result = await auditor.audit_report(
        report_metadata={
            "id": str(report.id),
            "title": report.title,
            "description": report.description,
            "report_type": report.report_type,
            "file_name": report.file_name,
            "file_path": report.file_path,
        },
        report_excerpt=excerpt,
    )

    _log_audit_event(
        db=db,
        user=current_user,
        action="antigravity_security_audit",
        resource_id=str(report.id),
        details={
            "security_score": audit_result.overall_security_score,
            "ifrs_score": audit_result.overall_ifrs_score,
            "is_safe_to_approve": audit_result.is_safe_to_approve,
        },
        request=request,
    )

    return audit_result.model_dump()


@router.get("/{report_id}/download")
def download_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Download report file.
    """
    report = db.query(Report).filter(Report.id == uuid.UUID(report_id)).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check permissions (strict deny-by-default)
    if not can_user_access_report(current_user, report):
        raise HTTPException(status_code=403, detail="Not authorized to download this report")
    
    if not report.file_path or not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    safe_download_name = sanitize_filename(report.file_name, fallback=f"report_{report.id}.pdf")
    return FileResponse(
        path=report.file_path,
        filename=safe_download_name,
        media_type="application/octet-stream"
    )


@router.get("/{report_id}/file")
def get_report_file(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get raw report file for inline viewing and browser preview.
    """
    try:
        report_uuid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid report ID format")

    report = db.query(Report).filter(Report.id == report_uuid).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if not can_user_access_report(current_user, report):
        raise HTTPException(status_code=403, detail="Not authorized to access this report")
    
    if not report.file_path or not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    ext = os.path.splitext(report.file_name or report.file_path)[1].lower()
    media_types = {
        ".pdf": "application/pdf",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".csv": "text/csv; charset=utf-8",
        ".txt": "text/plain; charset=utf-8",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
    media_type = media_types.get(ext, "application/octet-stream")
    safe_filename = sanitize_filename(report.file_name, fallback=f"report_{report.id}{ext or '.pdf'}")
    
    return FileResponse(
        path=report.file_path,
        filename=safe_filename,
        media_type=media_type,
        headers={
            "Content-Disposition": f'inline; filename="{safe_filename}"',
            "X-Content-Type-Options": "nosniff",
        }
    )


@router.delete("/{report_id}")
def delete_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Delete a report and all related data.
    """
    report = db.query(Report).filter(Report.id == uuid.UUID(report_id)).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    if not can_user_access_report(current_user, report):
        raise HTTPException(status_code=403, detail="Not authorized to delete this report")
    try:
        print(f"[DELETE] Attempting to delete report {report_id} by user {current_user.email}")
        
        # Validate UUID format
        report = None
        try:
            report_uuid = uuid.UUID(report_id)
            report = db.query(Report).filter(Report.id == report_uuid).first()
        except (ValueError, TypeError):
            try:
                report = db.query(Report).filter(Report.id == report_id).first()
            except Exception:
                report = None

        if not report:
            print(f"[DELETE] Report not found: {report_id}")
            raise HTTPException(status_code=404, detail="Report not found")
        
        print(f"[DELETE] Found report: {report.title} (status: {report.status}, company: {report.company_id})")
        
        # Check permissions
        if current_user.role in ["superadmin", "website_superadmin"] or getattr(current_user, "is_superuser", False):
            print(f"[DELETE] Superadmin access granted")
        elif current_user.role in ["admin", "company_admin", "company_owner", "company_superadmin"]:
            if report.company_id != current_user.company_id:
                print(f"[DELETE] Admin permission denied - different company")
                raise HTTPException(status_code=403, detail="Not authorized to delete reports of another company")
            print(f"[DELETE] Admin access granted for company {current_user.company_id}")
        elif report.submitted_by != current_user.id:
            print(f"[DELETE] User permission denied - not report owner")
            raise HTTPException(status_code=403, detail="Not authorized to delete this report")
        else:
            print(f"[DELETE] User access granted - report owner")
        
        # Only allow deleting drafts (unless admin/superadmin/owner)
        if current_user.role not in ["admin", "superadmin", "website_superadmin", "company_owner"] and report.status != "draft":
            print(f"[DELETE] Cannot delete non-draft report (status: {report.status})")
            raise HTTPException(status_code=400, detail="Can only delete draft reports")
        
        # Delete file if exists
        if report.file_path:
            if os.path.exists(report.file_path):
                try:
                    os.remove(report.file_path)
                    print(f"[DELETE] Deleted file: {report.file_path}")
                except OSError as e:
                    print(f"[DELETE] Warning: Could not delete file {report.file_path}: {e}")
            else:
                print(f"[DELETE] File not found on disk: {report.file_path}")
                
        # Manually delete related analyses (since no cascade)
        from app.db.models.report_analysis import ReportAnalysis
        analysis_count = db.query(ReportAnalysis).filter(ReportAnalysis.report_id == report.id).count()
        if analysis_count > 0:
            db.query(ReportAnalysis).filter(ReportAnalysis.report_id == report.id).delete()
            print(f"[DELETE] Deleted {analysis_count} related analysis record(s)")
        
        # Manually delete related comments (since no cascade)
        from app.db.models.report_comment import ReportComment
        comment_count = db.query(ReportComment).filter(ReportComment.report_id == report.id).count()
        if comment_count > 0:
            db.query(ReportComment).filter(ReportComment.report_id == report.id).delete()
            print(f"[DELETE] Deleted {comment_count} related comment(s)")
        
        # Delete the report
        db.delete(report)
        db.commit()
        print(f"[DELETE] Successfully deleted report {report_id}")
        
        return {"message": "Report deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        error_trace = traceback.format_exc()
        print(f"[DELETE] Error deleting report {report_id}:")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Failed to delete report: {str(e)}")


@router.put("/{report_id}", response_model=report_schemas.Report)
def update_report(
    report_id: str,
    report_in: report_schemas.ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update a draft report.
    """
    report = db.query(Report).filter(Report.id == uuid.UUID(report_id)).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check ownership
    if report.submitted_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this report")
    
    # Only allow updating drafts
    if report.status != "draft":
        raise HTTPException(status_code=400, detail="Can only update draft reports")
    
    if report_in.title is not None:
        report.title = report_in.title
    if report_in.description is not None:
        report.description = report_in.description
    if report_in.report_type is not None:
        report.report_type = report_in.report_type
    
    db.commit()
    db.refresh(report)
    return report


@router.get("/{report_id}/checklist")
def get_submission_checklist(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get pre-submission checklist for a report
    """
    report = db.query(Report).filter(Report.id == uuid.UUID(report_id)).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check permissions (strict deny-by-default)
    if not can_user_access_report(current_user, report):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    checklist: dict[str, Any] = {
        "items": [
            {
                "id": "title",
                "label": "Report title provided",
                "completed": bool(report.title and len(report.title) > 3),
                "required": True
            },
            {
                "id": "description",
                "label": "Description provided",
                "completed": bool(report.description and len(report.description) > 10),
                "required": True
            },
            {
                "id": "file",
                "label": "File attached",
                "completed": bool(report.file_path),
                "required": True
            },
            {
                "id": "type",
                "label": "Report type selected",
                "completed": bool(report.report_type),
                "required": True
            },
            {
                "id": "ai_analysis",
                "label": "AI analysis completed (score > 80%)",
                "completed": False,
                "required": False
            }
        ]
    }
    
    # Check if AI analysis exists
    from app.db.models.report_analysis import ReportAnalysis
    analysis = db.query(ReportAnalysis).filter(
        ReportAnalysis.report_id == report.id
    ).first()
    
    if analysis and analysis.overall_score:
        checklist["items"][4]["completed"] = analysis.overall_score >= 80
    
    # Calculate completion
    required_items = [item for item in checklist["items"] if item["required"]]
    completed_required = sum(1 for item in required_items if item["completed"])
    
    checklist["total_items"] = len(checklist["items"])
    checklist["completed_items"] = sum(1 for item in checklist["items"] if item["completed"])
    checklist["required_items"] = len(required_items)
    checklist["completed_required"] = completed_required
    checklist["can_submit"] = completed_required == len(required_items)
    checklist["completion_percentage"] = int((checklist["completed_items"] / checklist["total_items"]) * 100)
    
    return checklist


@router.post("/batch/download")
def batch_download_reports(
    report_ids: List[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get download links for multiple reports
    """
    results = []
    for report_id in report_ids:
        try:
            report = db.query(Report).filter(Report.id == uuid.UUID(report_id)).first()
            if not report:
                continue
            
            # Check permissions (strict deny-by-default)
            if not can_user_access_report(current_user, report):
                continue
            
            if report.file_path and os.path.exists(report.file_path):
                results.append({
                    "id": str(report.id),
                    "title": report.title,
                    "file_name": report.file_name,
                    "download_url": f"/api/v1/reports/{report.id}/download"
                })
        except Exception:
            continue
    
    return {"reports": results, "count": len(results)}


@router.get("/export/excel")
def export_reports_to_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Export reports to Excel file
    """
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment
    
    # Get reports strictly scoped to user tenant & company
    query = db.query(Report)
    if not (getattr(current_user, "is_superuser", False) or current_user.role in ["superadmin", "website_superadmin"]):
        if current_user.tenant_id:
            query = query.filter(Report.tenant_id == current_user.tenant_id)
        if current_user.role in ["accountant", "auditor"]:
            query = query.filter(Report.submitted_by == current_user.id)
        else:
            if current_user.company_id:
                query = query.filter(Report.company_id == current_user.company_id)
            else:
                return []
    
    reports = query.order_by(Report.created_at.desc()).all()
    
    # Create workbook
    wb = Workbook()
    ws = wb.active
    if ws is None:
        ws = wb.create_sheet()
    ws.title = "Reports"
    
    # Header style
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True)
    
    # Headers
    headers = ["Title", "Type", "Status", "Created", "Submitted", "Reviewed", "File Name"]
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")
    
    # Data (sanitized against Formula / CSV Injection CWE-1236)
    for row, report in enumerate(reports, 2):
        ws.cell(row=row, column=1, value=sanitize_excel_cell(report.title))
        ws.cell(row=row, column=2, value=sanitize_excel_cell((report.report_type or "").replace('_', ' ').title()))
        ws.cell(row=row, column=3, value=sanitize_excel_cell((report.status or "").upper()))
        ws.cell(row=row, column=4, value=report.created_at.strftime("%Y-%m-%d %H:%M") if report.created_at else "")
        ws.cell(row=row, column=5, value=report.submitted_at.strftime("%Y-%m-%d %H:%M") if report.submitted_at else "")
        ws.cell(row=row, column=6, value=report.reviewed_at.strftime("%Y-%m-%d %H:%M") if report.reviewed_at else "")
        ws.cell(row=row, column=7, value=sanitize_excel_cell(report.file_name or ""))
    
    # Adjust column widths
    for col in range(1, 8):
        ws.column_dimensions[chr(64 + col)].width = 20
    
    # Save to bytes
    excel_file = io.BytesIO()
    wb.save(excel_file)
    excel_file.seek(0)
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=reports_export.xlsx"}
    )
