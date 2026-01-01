from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
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
