from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.core.deps import get_db, get_current_active_user, get_current_active_superuser
from app.db.models.company import Company
from app.db.models.user import User
from app.db.schemas import company as company_schemas
from app.db.schemas import user as user_schemas

router = APIRouter()

@router.get("/", response_model=List[company_schemas.Company])
def read_companies(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    industry: Optional[str] = None,
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve companies. Superadmins see all, others see active only.
    """
    query = db.query(Company)
    
    # Non-superadmins only see active companies
    if current_user.role != "superadmin":
        query = query.filter(Company.is_active == True)
    elif is_active is not None:
        query = query.filter(Company.is_active == is_active)
    
    # Filter by industry if provided
    if industry:
        query = query.filter(Company.industry == industry)
    
    companies = query.offset(skip).limit(limit).all()
    return companies


@router.post("/", response_model=company_schemas.Company)
def create_company(
    *,
    db: Session = Depends(get_db),
    company_in: company_schemas.CompanyCreate,
    current_user = Depends(get_current_active_superuser),
) -> Any:
    """
    Create new company. Only superadmins can create companies.
    """
    try:
        # Check if company name already exists
        existing = db.query(Company).filter(Company.name == company_in.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Company with this name already exists")
        
        # Ensure tenant_id exists for the user
        if not current_user.tenant_id:
            # Fallback: try to find a default tenant or create one if missing (for superadmin bootstrap)
            # For now, just raise error if no tenant
            raise HTTPException(status_code=400, detail="Current user is not associated with a tenant. Cannot create company.")

        company = Company(
            id=uuid.uuid4(),
            name=company_in.name,
            domain=company_in.domain,
            description=company_in.description,
            logo_url=company_in.logo_url,
            website=company_in.website,
            industry=company_in.industry,
            employee_count=company_in.employee_count,
            tenant_id=current_user.tenant_id,
            is_active=True
        )
        db.add(company)
        db.commit()
        db.refresh(company)
        return company
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        print(f"Error creating company: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.get("/{company_id}", response_model=company_schemas.Company)
def get_company(
    company_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Get company by ID.
    """
    try:
        company_uuid = uuid.UUID(company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid company ID format")
    
    company = db.query(Company).filter(Company.id == company_uuid).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Non-superadmins can only see active companies
    if current_user.role != "superadmin" and not company.is_active:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return company


@router.put("/{company_id}", response_model=company_schemas.Company)
def update_company(
    company_id: str,
    company_in: company_schemas.CompanyUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_superuser),
) -> Any:
    """
    Update company. Only superadmins can update companies.
    """
    try:
        try:
            company_uuid = uuid.UUID(company_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid company ID format")
        
        company = db.query(Company).filter(Company.id == company_uuid).first()
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Check name uniqueness if changing name
        if company_in.name and company_in.name != company.name:
            existing = db.query(Company).filter(Company.name == company_in.name).first()
            if existing:
                raise HTTPException(status_code=400, detail="Company with this name already exists")
        
        # Update fields
        update_data = company_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(company, field, value)
        
        db.commit()
        db.refresh(company)
        return company
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        print(f"Error updating company: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.delete("/{company_id}")
def delete_company(
    company_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_superuser),
) -> Any:
    """
    Soft delete company (set is_active to False). Only superadmins can delete companies.
    """
    try:
        try:
            company_uuid = uuid.UUID(company_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid company ID format")
        
        company = db.query(Company).filter(Company.id == company_uuid).first()
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Soft delete
        company.is_active = False
        db.commit()
        
        return {"message": "Company deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        print(f"Error deleting company: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.get("/{company_id}/profile", response_model=company_schemas.CompanyProfile)
def get_company_profile(
    company_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Get company profile.
    """
    try:
        company_uuid = uuid.UUID(company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid company ID format")
    
    company = db.query(Company).filter(Company.id == company_uuid).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Non-superadmins can only see active companies
    if current_user.role != "superadmin" and not company.is_active:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return company


@router.put("/{company_id}/profile", response_model=company_schemas.CompanyProfile)
def update_company_profile(
    company_id: str,
    profile_in: company_schemas.CompanyUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Update company profile. Superadmins can update any, admins can update their own company.
    """
    try:
        company_uuid = uuid.UUID(company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid company ID format")
    
    company = db.query(Company).filter(Company.id == company_uuid).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Check permissions
    if current_user.role == "admin":
        if current_user.company_id != company_uuid:
            raise HTTPException(status_code=403, detail="Not authorized to update this company")
    elif current_user.role not in ["superadmin"]:
        raise HTTPException(status_code=403, detail="Not authorized to update companies")
    
    # Update profile fields only (not is_active for admins)
    update_data = profile_in.dict(exclude_unset=True, exclude={'is_active', 'name'})
    for field, value in update_data.items():
        setattr(company, field, value)
    
    db.commit()
    db.refresh(company)
    return company


@router.get("/{company_id}/users", response_model=List[user_schemas.User])
def get_company_users(
    company_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get all users in a company.
    """
    try:
        company_uuid = uuid.UUID(company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid company ID format")
    
    # Check if company exists
    company = db.query(Company).filter(Company.id == company_uuid).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Get users in this company
    users = db.query(User).filter(User.company_id == company_uuid).all()
    return users
