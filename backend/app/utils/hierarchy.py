"""
Hierarchy utility functions for role-based access control
"""
from typing import Optional
from app.db.models.user import User

# Hierarchy level constants
HIERARCHY_WEBSITE_SUPERADMIN = 1
HIERARCHY_COMPANY_OWNER = 2
HIERARCHY_COMPANY_SUPERADMIN = 3
HIERARCHY_COMPANY_ADMIN = 4
HIERARCHY_USER = 5

# Role to hierarchy level mapping
ROLE_HIERARCHY_MAP = {
    "website_superadmin": HIERARCHY_WEBSITE_SUPERADMIN,
    "company_owner": HIERARCHY_COMPANY_OWNER,
    "company_superadmin": HIERARCHY_COMPANY_SUPERADMIN,
    "company_admin": HIERARCHY_COMPANY_ADMIN,
    "admin": HIERARCHY_COMPANY_ADMIN,  # Backward compatibility
    "auditor": HIERARCHY_USER,
    "accountant": HIERARCHY_USER,
    "user": HIERARCHY_USER,
}

def get_hierarchy_level(role: str) -> int:
    """Get hierarchy level for a given role"""
    return ROLE_HIERARCHY_MAP.get(role, HIERARCHY_USER)

def can_manage_user(current_user: User, target_user: User) -> bool:
    """
    Check if current_user can manage target_user
    
    Rules:
    - Website SuperAdmin can manage anyone
    - Users can only manage users in their own company
    - Users can only manage users at lower hierarchy levels
    - Company owners cannot be managed by anyone except website superadmin
    """
    # Website SuperAdmin can manage anyone
    if current_user.hierarchy_level == HIERARCHY_WEBSITE_SUPERADMIN:
        return True
    
    # Can't manage users from different companies
    if current_user.company_id != target_user.company_id:
        return False
    
    # Can't manage users at same or higher level
    if current_user.hierarchy_level >= target_user.hierarchy_level:
        return False
    
    # Company owners can only be managed by website superadmin
    if target_user.is_company_owner and current_user.hierarchy_level != HIERARCHY_WEBSITE_SUPERADMIN:
        return False
    
    return True

def can_assign_role(current_user: User, target_role: str) -> bool:
    """
    Check if current_user can assign a specific role
    
    Rules:
    - Website SuperAdmin can assign any role
    - Company Owner can assign roles up to Company Admin
    - Company SuperAdmin can assign Admin, Auditor, Accountant
    - Company Admin can assign Auditor, Accountant
    """
    target_level = get_hierarchy_level(target_role)
    
    # Website SuperAdmin can assign any role
    if current_user.hierarchy_level == HIERARCHY_WEBSITE_SUPERADMIN:
        return True
    
    # Can only assign roles at lower levels than yourself
    if current_user.hierarchy_level >= target_level:
        return False
    
    # Company Owner cannot assign Website SuperAdmin or other Company Owners
    if current_user.hierarchy_level == HIERARCHY_COMPANY_OWNER and target_level <= HIERARCHY_COMPANY_OWNER:
        return False
    
    return True

def can_create_company(current_user: User) -> bool:
    """Check if user can create a new company"""
    return current_user.hierarchy_level == HIERARCHY_WEBSITE_SUPERADMIN

def can_delete_company(current_user: User, company_id: str) -> bool:
    """Check if user can delete a company"""
    # Website SuperAdmin can delete any company
    if current_user.hierarchy_level == HIERARCHY_WEBSITE_SUPERADMIN:
        return True
    
    # Company Owner can delete their own company
    if current_user.is_company_owner and str(current_user.company_id) == company_id:
        return True
    
    return False

def can_view_company_data(current_user: User, company_id: str) -> bool:
    """Check if user can view data from a specific company"""
    # Website SuperAdmin can view any company
    if current_user.hierarchy_level == HIERARCHY_WEBSITE_SUPERADMIN:
        return True
    
    # Users can only view their own company's data
    return str(current_user.company_id) == company_id

def get_role_display_name(role: str) -> str:
    """Get human-readable role name"""
    role_names = {
        "website_superadmin": "Website Super Admin",
        "company_owner": "Company Owner",
        "company_superadmin": "Company Super Admin",
        "company_admin": "Company Admin",
        "admin": "Admin",
        "auditor": "Auditor",
        "accountant": "Accountant",
        "user": "User",
    }
    return role_names.get(role, role.title())

def sync_user_hierarchy(user: User) -> None:
    """
    Sync user's hierarchy_level with their role
    Call this whenever a user's role is updated
    """
    user.hierarchy_level = get_hierarchy_level(user.role)
    
    # Update is_company_owner flag
    if user.role == "company_owner":
        user.is_company_owner = True
    else:
        user.is_company_owner = False
