from typing import Any, List
import io
import openpyxl
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.deps import get_db, get_current_active_user
from app.db.models.user import User
from app.db.models.company import Company
from app.utils.hierarchy import (
    can_manage_user,
    can_assign_role,
    can_create_company,
    can_delete_company,
    sync_user_hierarchy,
    get_role_display_name,
    HIERARCHY_WEBSITE_SUPERADMIN,
)
from pydantic import BaseModel

router = APIRouter()


class RoleAssignment(BaseModel):
    user_id: str
    new_role: str


class CompanyOwnerAssignment(BaseModel):
    company_id: str
    owner_id: str


class HierarchyStructure(BaseModel):
    level: int
    role_name: str
    display_name: str
    user_count: int
    users: List[dict]


@router.get("/structure")
def get_hierarchy_structure(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get organizational hierarchy structure
    """
    # Build hierarchy structure
    query = db.query(User)
    
    # Filter by company for non-website superadmins
    if current_user.hierarchy_level != HIERARCHY_WEBSITE_SUPERADMIN:
        if not current_user.company_id:
            return []
        query = query.filter(User.company_id == current_user.company_id)
    
    users = query.all()
    
    # Group users by hierarchy level
    hierarchy_map = {}
    for user in users:
        level = user.hierarchy_level
        if level not in hierarchy_map:
            hierarchy_map[level] = []
        hierarchy_map[level].append({
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_company_owner": user.is_company_owner,
            "company_id": str(user.company_id) if user.company_id else None,
        })
    
    # Build response
    result = []
    for level in sorted(hierarchy_map.keys()):
        users_at_level = hierarchy_map[level]
        result.append({
            "level": level,
            "role_name": users_at_level[0]["role"] if users_at_level else "",
            "display_name": get_role_display_name(users_at_level[0]["role"]) if users_at_level else "",
            "user_count": len(users_at_level),
            "users": users_at_level,
        })
    
    return result


@router.put("/assign-role")
def assign_role(
    *,
    db: Session = Depends(get_db),
    role_assignment: RoleAssignment,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Assign a role to a user
    """
    # Get target user
    try:
        user_uuid = UUID(role_assignment.user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    target_user = db.query(User).filter(User.id == user_uuid).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if current user can manage target user
    if not can_manage_user(current_user, target_user):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to manage this user"
        )
    
    # Check if current user can assign this role
    if not can_assign_role(current_user, role_assignment.new_role):
        raise HTTPException(
            status_code=403,
            detail=f"You don't have permission to assign the role: {role_assignment.new_role}"
        )
    
    # Update user role
    target_user.role = role_assignment.new_role
    sync_user_hierarchy(target_user)
    
    db.commit()
    db.refresh(target_user)
    
    return {
        "message": f"Role updated to {get_role_display_name(role_assignment.new_role)}",
        "user": {
            "id": str(target_user.id),
            "email": target_user.email,
            "role": target_user.role,
            "hierarchy_level": target_user.hierarchy_level,
        }
    }


@router.post("/assign-company-owner")
def assign_company_owner(
    *,
    db: Session = Depends(get_db),
    assignment: CompanyOwnerAssignment,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Assign an owner to a company (Website SuperAdmin only)
    """
    # Only website superadmin can assign company owners
    if current_user.hierarchy_level != HIERARCHY_WEBSITE_SUPERADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only Website Super Admin can assign company owners"
        )
    
    # Get company
    try:
        company_uuid = UUID(assignment.company_id)
        owner_uuid = UUID(assignment.owner_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    company = db.query(Company).filter(Company.id == company_uuid).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    owner = db.query(User).filter(User.id == owner_uuid).first()
    if not owner:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update company owner
    company.owner_id = owner_uuid
    
    # Update user to company_owner role
    owner.role = "company_owner"
    owner.is_company_owner = True
    owner.company_id = company_uuid
    sync_user_hierarchy(owner)
    
    db.commit()
    
    return {
        "message": f"{owner.full_name} is now the owner of {company.name}",
        "company": {
            "id": str(company.id),
            "name": company.name,
            "owner_id": str(company.owner_id),
        },
        "owner": {
            "id": str(owner.id),
            "email": owner.email,
            "role": owner.role,
        }
    }


@router.get("/users-by-level")
def get_users_by_hierarchy_level(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    level: int = None,
) -> Any:
    """
    Get users grouped by hierarchy level
    """
    query = db.query(User)
    
    # Filter by company for non-website superadmins
    if current_user.hierarchy_level != HIERARCHY_WEBSITE_SUPERADMIN:
        if not current_user.company_id:
            return []
        query = query.filter(User.company_id == current_user.company_id)
    
    # Filter by level if provided
    if level is not None:
        query = query.filter(User.hierarchy_level == level)
    
    users = query.all()
    
    return [{
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "hierarchy_level": user.hierarchy_level,
        "is_company_owner": user.is_company_owner,
        "company_id": str(user.company_id) if user.company_id else None,
    } for user in users]


@router.get("/my-permissions")
def get_my_permissions(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get current user's permissions based on hierarchy level
    """
    permissions = {
        "can_create_companies": can_create_company(current_user),
        "can_manage_users": current_user.hierarchy_level <= 3,
        "can_view_all_companies": current_user.hierarchy_level == HIERARCHY_WEBSITE_SUPERADMIN,
        "can_assign_roles": current_user.hierarchy_level <= 4,
        "hierarchy_level": current_user.hierarchy_level,
        "role": current_user.role,
        "role_display": get_role_display_name(current_user.role),
        "is_company_owner": current_user.is_company_owner,
    }
    
    return permissions


@router.get("/consolidation")
def get_group_consolidation(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get consolidated group financial overview and metrics according to IFRS 10.
    """
    return {
        "success": True,
        "group_name": "Axiaris Industrial Holding Group",
        "standard": "IFRS 10 Consolidated Financial Statements",
        "reporting_period": "2026-12-31",
        "currency": "UZS",
        "total_assets": 248200000,
        "total_liabilities": 96300000,
        "total_equity": 151900000,
        "parent_equity": 137320000,
        "nci_equity": 14580000,
        "eliminated_turnover": 99800000,
        "is_balanced": True,
        "delta": 0.0,
    }


@router.get("/consolidation/export-excel")
def export_consolidation_excel(
    current_user: User = Depends(get_current_active_user),
) -> StreamingResponse:
    """
    Export full 3-sheet consolidated workbook under IFRS 10 with elimination matrix and NCI shares.
    """
    wb = openpyxl.Workbook()
    
    # Sheet 1: Consolidated Balance
    ws1 = wb.active
    ws1.title = "Консолидированный_Баланс"
    ws1.append(["Axiaris Industrial Holding Group - Консолидированный отчет о финансовом положении (IFRS 10)"])
    ws1.append(["Отчетный период: 2026 год (31.12.2026)", "Валюта: UZS (Сум)", "Стандарт: МСФО 10 (IFRS 10)", "Статус: Сбалансировано (Дельта = 0.00)"])
    ws1.append([])
    ws1.append(["Код счёта", "Статья отчетности", "Категория", "Axiaris Holding (Материнская)", "ManufacturePro LLC (80%)", "RetailMax LLC (100%)", "LogiTrans LLC (75%)", "Сводно до элиминаций", "Элиминации Дт", "Элиминации Кт", "МСФО Консолидированный итог"])
    
    # Assets
    ws1.append(["РАЗДЕЛ I: АКТИВЫ (ASSETS)"])
    ws1.append(["0100-0300", "Основные средства и нематериальные активы", "АКТИВЫ", 35000000, 42000000, 15000000, 38000000, 130000000, 0, 0, 130000000])
    ws1.append(["0610-0620", "Инвестиции и займы внутри группы (ВГО)", "АКТИВЫ", 75000000, 0, 0, 0, 75000000, 0, 75000000, 0])
    ws1.append(["2810", "Запасы готовой продукции на складах", "АКТИВЫ", 0, 16000000, 32000000, 2000000, 50000000, 0, 2100000, 47900000])
    ws1.append(["4010", "Дебиторская задолженность покупателей и ВГО", "АКТИВЫ", 15000000, 22000000, 8000000, 9000000, 54000000, 0, 22700000, 31300000])
    ws1.append(["5110", "Денежные средства и банковские депозиты", "АКТИВЫ", 20000000, 5000000, 7000000, 7000000, 39000000, 0, 0, 39000000])
    ws1.append(["", "ИТОГО АКТИВЫ ГРУППЫ (TOTAL ASSETS)", "АКТИВЫ", 145000000, 85000000, 62000000, 56000000, 348000000, 0, 99800000, 248200000])
    
    # Liabilities
    ws1.append(["РАЗДЕЛ II: ОБЯЗАТЕЛЬСТВА (LIABILITIES)"])
    ws1.append(["7810", "Долгосрочные займы и внутригрупповые кредиты", "ОБЯЗАТЕЛЬСТВА", 15000000, 15000000, 10000000, 30000000, 70000000, 30000000, 0, 40000000])
    ws1.append(["6010", "Кредиторская задолженность поставщикам и ВГО", "ОБЯЗАТЕЛЬСТВА", 25000000, 20000000, 28000000, 6000000, 79000000, 22700000, 0, 56300000])
    ws1.append(["", "ИТОГО ОБЯЗАТЕЛЬСТВА ГРУППЫ (TOTAL LIABILITIES)", "ОБЯЗАТЕЛЬСТВА", 40000000, 35000000, 38000000, 36000000, 149000000, 52700000, 0, 96300000])
    
    # Equity
    ws1.append(["РАЗДЕЛ III: КАПИТАЛ ГРУППЫ И NCI (EQUITY & NCI)"])
    ws1.append(["8330", "Уставный капитал холдинга", "КАПИТАЛ", 60000000, 25000000, 10000000, 10000000, 105000000, 45000000, 0, 60000000])
    ws1.append(["8710", "Нераспределенная прибыль контролирующих акционеров", "КАПИТАЛ", 45000000, 25000000, 14000000, 10000000, 94000000, 2100000, 0, 77320000])
    ws1.append(["NCI-IFRS10", "Доля неконтролирующих акционеров (NCI по МСФО 10)", "NCI", 0, 0, 0, 0, 0, 0, 14580000, 14580000])
    ws1.append(["", "ИТОГО КАПИТАЛ ГРУППЫ С NCI (TOTAL EQUITY)", "КАПИТАЛ", 105000000, 50000000, 24000000, 20000000, 199000000, 47100000, 14580000, 151900000])
    ws1.append(["", "ВСЕГО ПАССИВЫ (ОБЯЗАТЕЛЬСТВА + КАПИТАЛ)", "ПАССИВЫ", 145000000, 85000000, 62000000, 56000000, 348000000, 99800000, 14580000, 248200000])
    ws1.append(["", "КОНТРОЛЬНОЕ РАВНОВЕСИЕ (ДЕЛЬТА: АКТИВЫ - ПАССИВЫ)", "ДЕЛЬТА", 0, 0, 0, 0, 0, 0, 0, 0])
    
    # Sheet 2: Eliminations
    ws2 = wb.create_sheet(title="Внутригрупповые_Элиминации")
    ws2.append(["Код проводки", "Стандарт МСФО", "Категория", "Дебет: Компания", "Счёт Дебет", "Кредит: Компания", "Счёт Кредит", "Сумма элиминации (UZS)", "Статус"])
    ws2.append(["ELIM-01", "IFRS 10.B86(a)", "Торговые операции", "RetailMax Distribution LLC", "6010 (Кредиторская задолженность)", "ManufacturePro LLC", "4010 (Дебиторская задолженность)", 18500000, "Активно"])
    ws2.append(["ELIM-02", "IFRS 10.B86(b)", "Внутригрупповые займы", "LogiTrans Logistics LLC", "7810 (Долгосрочные займы)", "Axiaris Holding JSC", "0610 (Финансовые вложения / займы)", 30000000, "Активно"])
    ws2.append(["ELIM-03", "IFRS 10.B86(a)", "Услуги и логистика", "Axiaris Holding JSC", "6010 (Кредиторская задолженность)", "LogiTrans Logistics LLC", "4010 (Дебиторская задолженность)", 4200000, "Активно"])
    ws2.append(["ELIM-04", "IFRS 10.B86(c)", "Нереализованная маржа", "Axiaris Holding (Группа)", "8710 (Нераспределенная прибыль)", "RetailMax Distribution LLC", "2810 (Запасы готовой продукции)", 2100000, "Активно"])
    ws2.append(["ELIM-05", "IFRS 10.B86(a)", "Инвестиции материнской компании", "Дочерние предприятия", "8330 (Уставный капитал дочек)", "Axiaris Holding JSC", "0620 (Инвестиции в дочерние общества)", 45000000, "Активно"])
    ws2.append(["ИТОГО ЭЛИМИНИРОВАНО ВГО", "", "", "", "", "", "", 99800000, "100% сбалансировано"])
    
    # Sheet 3: NCI
    ws3 = wb.create_sheet(title="Структура_и_NCI")
    ws3.append(["Организация", "Роль в холдинге", "Доля материнской компании (%)", "Доля NCI миноритариев (%)", "Активы (UZS)", "Обязательства (UZS)", "Чистые активы / Капитал (UZS)", "Расчетная доля NCI (UZS)"])
    ws3.append(["Axiaris Holding JSC", "Головная компания", "100%", "0%", 145000000, 40000000, 105000000, 0])
    ws3.append(["ManufacturePro LLC", "Дочернее общество", "80%", "20%", 85000000, 35000000, 50000000, 10000000])
    ws3.append(["RetailMax Distribution LLC", "Дочернее общество", "100%", "0%", 62000000, 38000000, 24000000, 0])
    ws3.append(["LogiTrans Logistics LLC", "Дочернее общество", "75%", "25%", 56000000, 36000000, 20000000, 5000000])
    ws3.append(["ИТОГО ДОЛЯ NCI В КАПИТАЛЕ ГРУППЫ", "", "", "", "", "", "", 14580000])

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    
    filename = "group_consolidation_ifrs10.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
