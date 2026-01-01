from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.core import security
from app.core.deps import get_db, get_current_active_user, get_current_active_superuser
from app.db.models.user import User
from app.db.schemas import user as user_schemas
from app.utils.hierarchy import (
    can_assign_role,
    sync_user_hierarchy,
    HIERARCHY_WEBSITE_SUPERADMIN,
)

router = APIRouter()

@router.get("/", response_model=List[user_schemas.User])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    company_id: str = None,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve users. Filtered by hierarchy permissions.
    """
    query = db.query(User)
    
    # Filter by company for non-website superadmins
    if current_user.hierarchy_level != HIERARCHY_WEBSITE_SUPERADMIN:
        if not current_user.company_id:
            return []
        query = query.filter(User.company_id == current_user.company_id)
        # Non-superadmins can only see users at their level or below
        query = query.filter(User.hierarchy_level >= current_user.hierarchy_level)
    # For website superadmins, allow filtering by company_id if provided
    elif company_id:
        import uuid
        try:
            company_uuid = uuid.UUID(company_id)
            query = query.filter(User.company_id == company_uuid)
        except ValueError:
            # Invalid UUID format, return empty or ignore
            return []
        
    users = query.offset(skip).limit(limit).all()
    return users

@router.post("/", response_model=user_schemas.User)
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: user_schemas.UserCreate,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    Create new user with hierarchy validation.
    """
    # Check if user already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    
    # Validate role assignment permission
    if not can_assign_role(current_user, user_in.role):
        raise HTTPException(
            status_code=403,
            detail=f"You don't have permission to assign the role: {user_in.role}",
        )
    
    # Create user
    user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        is_superuser=user_in.is_superuser,
        tenant_id=user_in.tenant_id,
        company_id=user_in.company_id if hasattr(user_in, 'company_id') else None,
    )
    
    # Sync hierarchy level based on role
    sync_user_hierarchy(user)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/me", response_model=user_schemas.User)
def read_user_me(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.post("/invite", response_model=user_schemas.User)
def invite_user(
    *,
    db: Session = Depends(get_db),
    user_in: user_schemas.UserCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Invite a new user to the current user's company with hierarchy validation.
    """
    # Check if current user can manage users (hierarchy level 4 or higher)
    if current_user.hierarchy_level > 4:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to invite users",
        )
    
    # Check if user already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    # Validate role assignment permission
    if not can_assign_role(current_user, user_in.role):
        raise HTTPException(
            status_code=403,
            detail=f"You don't have permission to assign the role: {user_in.role}",
        )
    
    # For non-website superadmins, set company_id to their own company
    company_id = user_in.company_id
    if current_user.hierarchy_level != HIERARCHY_WEBSITE_SUPERADMIN:
        if not current_user.company_id:
            raise HTTPException(
                status_code=400,
                detail="You must be assigned to a company to invite users.",
            )
        company_id = current_user.company_id
    
    # Create user
    user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        is_superuser=False,  # Cannot invite superusers via this endpoint
        tenant_id=current_user.tenant_id,
        company_id=company_id
    )
    
    # Sync hierarchy level based on role
    sync_user_hierarchy(user)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=user_schemas.User)
def update_user(
    *,
    db: Session = Depends(get_db),
    user_id: str,
    user_in: user_schemas.UserUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update user role with hierarchy validation.
    """
    import uuid
    
    # Check if current user can manage users
    if current_user.hierarchy_level > 4:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to update users",
        )
    
    # Find user to update
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check permissions
    if current_user.hierarchy_level != HIERARCHY_WEBSITE_SUPERADMIN:
        # Non-superadmins can only update users in their company
        if user.company_id != current_user.company_id:
            raise HTTPException(
                status_code=403,
                detail="You can only update users in your company",
            )
        # Cannot update users at higher hierarchy level
        if user.hierarchy_level < current_user.hierarchy_level:
            raise HTTPException(
                status_code=403,
                detail="You cannot update users with higher privileges",
            )
    
    # Validate role assignment if role is being changed
    if user_in.role is not None and user_in.role != user.role:
        if not can_assign_role(current_user, user_in.role):
            raise HTTPException(
                status_code=403,
                detail=f"You don't have permission to assign the role: {user_in.role}",
            )
        user.role = user_in.role
        # Sync hierarchy level based on new role
        sync_user_hierarchy(user)
    
    # Update email (superadmin only)
    if user_in.email is not None and user_in.email != user.email:
        if current_user.hierarchy_level != HIERARCHY_WEBSITE_SUPERADMIN:
            raise HTTPException(
                status_code=403,
                detail="Only superadmins can change user emails",
            )
        # Check if email is already taken
        existing_user = db.query(User).filter(User.email == user_in.email).first()
        if existing_user and existing_user.id != user.id:
            raise HTTPException(
                status_code=400,
                detail="Email already in use by another user",
            )
        user.email = user_in.email
    
    # Update password (superadmin only)
    if user_in.password is not None:
        if current_user.hierarchy_level != HIERARCHY_WEBSITE_SUPERADMIN:
            raise HTTPException(
                status_code=403,
                detail="Only superadmins can reset user passwords",
            )
        user.hashed_password = security.get_password_hash(user_in.password)
    
    # Update other fields if provided
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    
    db.commit()
    db.refresh(user)
    return user
