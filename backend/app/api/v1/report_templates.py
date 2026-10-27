from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.core.deps import get_db, get_current_active_user
from app.db.models.report_template import ReportTemplate
from app.db.models.report import Report
from app.db.models.user import User
from app.db.models.audit_log import AuditLog
from app.db.schemas import report_template as template_schemas

router = APIRouter()

def seed_standard_templates(db: Session, current_user: User):
    from app.db.models.company import Company
    from app.db.models.tenant import Tenant
    company_id = current_user.company_id
    tenant_id = current_user.tenant_id
    if not company_id:
        comp = db.query(Company).first()
        if comp:
            company_id = comp.id
            tenant_id = comp.tenant_id
    if not tenant_id:
        ten = db.query(Tenant).first()
        if ten:
            tenant_id = ten.id

    if not company_id or not tenant_id:
        return

    default_templates = [
        {
            "name": "Трансформация МСФО 16: Аренда и сверка капитала",
            "description": "Пакет регламентных проверок и дисконтирования арендных обязательств, признания ППА (счета 08/79) и контроля Zero Delta.",
            "report_type": "financial",
            "country_code": "UZ",
            "tax_types": ["vat", "corporate"],
            "is_recurring": True,
            "recurrence_pattern": "quarterly",
            "configuration": {
                "source_standard": "NAS",
                "target_standard": "IFRS",
                "data_source_type": "onec_sync",
                "required_accounts": ["01", "02", "60", "67", "84"],
                "strict_validation": True,
                "active_standards": ["IFRS 16", "IAS 36", "IFRS 9"],
                "enforce_zero_delta": True,
                "ai_audit_enabled": True,
                "ai_expert_role": "Senior IFRS Big 4 Auditor",
                "ai_prompt": "Проверь корректность классификации договоров аренды по МСФО 16, ставку дисконтирования и авто-балансировку нераспределенной прибыли.",
                "risk_triggers": ["unbalanced_equity", "undisclosed_lease_terms"],
                "output_language": "ru",
                "approval_chain": ["accountant", "auditor", "admin"]
            }
        },
        {
            "name": "Налоговый аудит и резервирование IFRS 9 (ECL)",
            "description": "Комплексный чек-лист выявления налоговых разрывов по НДС и расчет ожидаемых кредитных убытков по дебиторской задолженности.",
            "report_type": "compliance",
            "country_code": "UZ",
            "tax_types": ["vat", "income", "corporate"],
            "is_recurring": True,
            "recurrence_pattern": "monthly",
            "configuration": {
                "source_standard": "NAS",
                "target_standard": "TAX_CODE",
                "data_source_type": "excel_upload",
                "required_accounts": ["40", "60", "62", "64", "84"],
                "strict_validation": True,
                "active_standards": ["IFRS 9", "IAS 12"],
                "enforce_zero_delta": True,
                "ai_audit_enabled": True,
                "ai_expert_role": "Tax Compliance Advisor (UZ/CIS)",
                "ai_prompt": "Проанализируй налогооблагаемую базу по налогу на прибыль и зачетный НДС в соответствии с Налоговым кодексом РУз, выяви налоговые риски.",
                "risk_triggers": ["vat_gap", "stale_receivables"],
                "output_language": "ru",
                "approval_chain": ["accountant", "auditor"]
            }
        },
        {
            "name": "Аудит и сверка ОСВ 1С с трансформационным балансом",
            "description": "Автоматическая сверка оборотно-сальдовой ведомости 1С:Предприятие со счетами Главной книги и контролем баланса.",
            "report_type": "audit",
            "country_code": "UZ",
            "tax_types": ["corporate"],
            "is_recurring": True,
            "recurrence_pattern": "quarterly",
            "configuration": {
                "source_standard": "1C_COA",
                "target_standard": "IFRS",
                "data_source_type": "onec_sync",
                "required_accounts": ["01", "10", "51", "60", "62", "80", "84"],
                "strict_validation": True,
                "active_standards": ["IFRS 16", "IAS 36"],
                "enforce_zero_delta": True,
                "ai_audit_enabled": True,
                "ai_expert_role": "Forensic & Fraud Investigator",
                "ai_prompt": "Сверь оборотно-сальдовую ведомость 1С с трансформационным балансом, найди нетипичные сальдо и крупные проводки с аффилированными лицами.",
                "risk_triggers": ["unbalanced_equity", "abnormal_turnover"],
                "output_language": "ru",
                "approval_chain": ["accountant", "auditor", "admin"]
            }
        }
    ]

    for item in default_templates:
        t = ReportTemplate(
            id=uuid.uuid4(),
            created_by=current_user.id,
            company_id=company_id,
            tenant_id=tenant_id,
            **item
        )
        db.add(t)
    db.commit()


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
    if current_user.role not in ["accountant", "auditor", "admin", "superadmin", "company_owner"]:
        raise HTTPException(status_code=403, detail="Not authorized to create templates")
    
    company_id = current_user.company_id
    tenant_id = current_user.tenant_id

    if not company_id:
        from app.db.models.company import Company
        first_comp = db.query(Company).first()
        if first_comp:
            company_id = first_comp.id
            if not tenant_id:
                tenant_id = first_comp.tenant_id

    if not tenant_id and current_user.tenant_id:
        tenant_id = current_user.tenant_id
    elif not tenant_id:
        from app.db.models.tenant import Tenant
        first_tenant = db.query(Tenant).first()
        if first_tenant:
            tenant_id = first_tenant.id

    template = ReportTemplate(
        id=uuid.uuid4(),
        name=template_in.name,
        description=template_in.description,
        report_type=template_in.report_type,
        country_code=template_in.country_code,
        tax_types=template_in.tax_types,
        configuration=template_in.configuration,
        is_recurring=template_in.is_recurring,
        recurrence_pattern=template_in.recurrence_pattern,
        created_by=current_user.id,
        company_id=company_id,
        tenant_id=tenant_id,
    )
    
    db.add(template)
    db.commit()
    db.refresh(template)

    if tenant_id:
        try:
            log_entry = AuditLog(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                user_id=current_user.id,
                action="template_created",
                resource_type="template",
                resource_id=str(template.id),
                details=f"Created template '{template.name}' ({template.report_type})",
                success=True
            )
            db.add(log_entry)
            db.commit()
        except Exception:
            pass

    return template


def _is_superadmin(user: User) -> bool:
    return bool(getattr(user, "is_superuser", False) or user.role in ["superadmin", "website_superadmin"])


def _can_manage_template(user: User, template: ReportTemplate) -> bool:
    """Strict tenant and company isolation check for modifying/deleting templates."""
    if _is_superadmin(user):
        return True
    if template.tenant_id and user.tenant_id and template.tenant_id != user.tenant_id:
        return False
    if template.created_by == user.id:
        return True
    if user.role in ["admin", "company_admin", "company_owner", "company_superadmin"]:
        return bool(user.company_id and template.company_id == user.company_id)
    return False


def _can_view_template(user: User, template: ReportTemplate) -> bool:
    """Strict tenant and company isolation check for reading/using templates."""
    if _is_superadmin(user):
        return True
    if template.company_id is None:
        return True
    if template.tenant_id and user.tenant_id and template.tenant_id != user.tenant_id:
        return False
    if template.created_by == user.id:
        return True
    if user.company_id and template.company_id == user.company_id:
        return True
    return False


@router.get("/", response_model=List[template_schemas.ReportTemplate])
def list_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    List report templates (strict tenant and company isolation).
    """
    # Auto-seed standard templates if DB has no templates yet
    if db.query(ReportTemplate).count() == 0:
        try:
            seed_standard_templates(db, current_user)
        except Exception:
            db.rollback()

    # Superadmin sees all templates
    if _is_superadmin(current_user):
        templates = db.query(ReportTemplate).offset(skip).limit(limit).all()
    elif current_user.company_id:
        # Company members see templates for their company or created by them, or global templates
        templates = db.query(ReportTemplate).filter(
            (ReportTemplate.company_id == current_user.company_id) |
            (ReportTemplate.created_by == current_user.id) |
            (ReportTemplate.company_id.is_(None))
        ).offset(skip).limit(limit).all()
    else:
        # Users without a company only see their own templates or global templates (deny cross-tenant leakage)
        templates = db.query(ReportTemplate).filter(
            (ReportTemplate.created_by == current_user.id) |
            (ReportTemplate.company_id.is_(None))
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
    
    if not _can_view_template(current_user, template):
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
    
    if not _can_manage_template(current_user, template):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update fields
    update_data = template_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)
    
    db.commit()
    db.refresh(template)

    if template.tenant_id:
        try:
            log_entry = AuditLog(
                id=uuid.uuid4(),
                tenant_id=template.tenant_id,
                user_id=current_user.id,
                action="template_updated",
                resource_type="template",
                resource_id=str(template.id),
                details=f"Updated template '{template.name}'",
                success=True
            )
            db.add(log_entry)
            db.commit()
        except Exception:
            pass

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
    
    if not _can_manage_template(current_user, template):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    saved_tenant_id = template.tenant_id
    saved_name = template.name
    saved_id = str(template.id)

    db.delete(template)
    db.commit()

    if saved_tenant_id:
        try:
            log_entry = AuditLog(
                id=uuid.uuid4(),
                tenant_id=saved_tenant_id,
                user_id=current_user.id,
                action="template_deleted",
                resource_type="template",
                resource_id=saved_id,
                details=f"Deleted template '{saved_name}'",
                success=True
            )
            db.add(log_entry)
            db.commit()
        except Exception:
            pass

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
    
    if not _can_view_template(current_user, template):
        raise HTTPException(status_code=403, detail="Not authorized to use this template")

    if current_user.tenant_id:
        try:
            log_entry = AuditLog(
                id=uuid.uuid4(),
                tenant_id=current_user.tenant_id,
                user_id=current_user.id,
                action="template_used",
                resource_type="template",
                resource_id=str(template.id),
                details=f"Applied template '{template.name}' to prefill report",
                success=True
            )
            db.add(log_entry)
            db.commit()
        except Exception:
            pass

    # Return template data for form pre-fill
    return {
        "title": f"{template.name} - {template.recurrence_pattern or 'Report'}",
        "template_name": template.name,
        "description": template.description,
        "report_type": template.report_type,
        "country_code": template.country_code,
        "tax_types": template.tax_types,
        "configuration": template.configuration,
        "company_id": str(current_user.company_id) if current_user.company_id else ""
    }
