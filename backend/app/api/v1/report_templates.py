from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.core.deps import get_db, get_current_active_user
from app.db.models.report_template import ReportTemplate
from app.db.models.report import Report
from app.db.models.user import User
from app.db.schemas import report_template as template_schemas

router = APIRouter()

@router.post("/", response_model=template_schemas.ReportTemplate)
def create_template(
    *,
    db: Session = Depends(get_db),
    template_in: template_schemas.ReportTemplateCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create new report template
    """
    # Only accountants, auditors, and admins can create templates
    if current_user.role not in ["accountant", "auditor", "admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Not authorized to create templates")
    
    template = ReportTemplate(
        id=uuid.uuid4(),
        name=template_in.name,
        description=template_in.description,
        report_type=template_in.report_type,
        country_code=template_in.country_code,
        tax_types=template_in.tax_types,
        is_recurring=template_in.is_recurring,
        recurrence_pattern=template_in.recurrence_pattern,
        created_by=current_user.id,
        company_id=current_user.company_id,
        tenant_id=current_user.tenant_id,
    )
    
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get("/", response_model=List[template_schemas.ReportTemplate])
def list_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    List report templates
    """
    # Filter by role
    if current_user.role == "superadmin":
        templates = db.query(ReportTemplate).offset(skip).limit(limit).all()
    elif current_user.role == "admin":
        templates = db.query(ReportTemplate).filter(
            ReportTemplate.company_id == current_user.company_id
        ).offset(skip).limit(limit).all()
    else:  # accountant, auditor
        templates = db.query(ReportTemplate).filter(
            ReportTemplate.created_by == current_user.id
        ).offset(skip).limit(limit).all()
    
    return templates


@router.get("/{template_id}", response_model=template_schemas.ReportTemplate)
def get_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get template by ID
    """
    template = db.query(ReportTemplate).filter(
        ReportTemplate.id == uuid.UUID(template_id)
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Check permissions
    if current_user.role == "superadmin":
        pass
    elif current_user.role == "admin":
        if template.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    else:
        if template.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    return template


@router.put("/{template_id}", response_model=template_schemas.ReportTemplate)
def update_template(
    template_id: str,
    template_in: template_schemas.ReportTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update template
    """
    template = db.query(ReportTemplate).filter(
        ReportTemplate.id == uuid.UUID(template_id)
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Check ownership
    if template.created_by != current_user.id and current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update fields
    update_data = template_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)
    
    db.commit()
    db.refresh(template)
    return template


@router.delete("/{template_id}")
def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Delete template
    """
    template = db.query(ReportTemplate).filter(
        ReportTemplate.id == uuid.UUID(template_id)
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Check ownership
    if template.created_by != current_user.id and current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(template)
    db.commit()
    return {"message": "Template deleted"}


@router.post("/{template_id}/use")
def use_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create a new report from template
    Returns template data to pre-fill the report form
    """
    template = db.query(ReportTemplate).filter(
        ReportTemplate.id == uuid.UUID(template_id)
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Check permissions
    if current_user.role not in ["superadmin", "admin"]:
        if template.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    # Return template data for form pre-fill
    return {
        "title": f"{template.name} - {template.recurrence_pattern or 'Report'}",
        "description": template.description,
        "report_type": template.report_type,
        "country_code": template.country_code,
        "tax_types": template.tax_types,
        "company_id": str(current_user.company_id)
    }
