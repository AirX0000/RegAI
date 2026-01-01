from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_active_superuser
from app.db.models.tenant import Tenant
from app.db.schemas import tenant as tenant_schemas

router = APIRouter()

@router.get("/", response_model=List[tenant_schemas.Tenant])
def read_tenants(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_active_superuser),
) -> Any:
    """
    Retrieve tenants. Only for superusers.
    """
    tenants = db.query(Tenant).offset(skip).limit(limit).all()
    return tenants

@router.post("/", response_model=tenant_schemas.Tenant)
def create_tenant(
    *,
    db: Session = Depends(get_db),
    tenant_in: tenant_schemas.TenantCreate,
    current_user = Depends(get_current_active_superuser),
) -> Any:
    """
    Create new tenant. Only for superusers.
    """
    tenant = db.query(Tenant).filter(Tenant.name == tenant_in.name).first()
    if tenant:
        raise HTTPException(
            status_code=400,
            detail="The tenant with this name already exists in the system.",
        )
    tenant = Tenant(name=tenant_in.name, plan=tenant_in.plan)
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant

@router.put("/{tenant_id}", response_model=tenant_schemas.Tenant)
def update_tenant(
    *,
    db: Session = Depends(get_db),
    tenant_id: str,
    tenant_in: tenant_schemas.TenantUpdate,
    current_user = Depends(get_current_active_superuser),
) -> Any:
    """
    Update tenant. Only for superusers.
    """
    from uuid import UUID
    tenant_uuid = UUID(tenant_id)
    tenant = db.query(Tenant).filter(Tenant.id == tenant_uuid).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Update fields if provided
    if tenant_in.plan is not None:
        tenant.plan = tenant_in.plan
    if tenant_in.is_active is not None:
        tenant.is_active = tenant_in.is_active
    if tenant_in.name is not None:
        tenant.name = tenant_in.name
    
    db.commit()
    db.refresh(tenant)
    return tenant

@router.delete("/{tenant_id}")
def delete_tenant(
    *,
    db: Session = Depends(get_db),
    tenant_id: str,
    current_user = Depends(get_current_active_superuser),
) -> Any:
    """
    Delete tenant. Only for superusers.
    """
    from uuid import UUID
    tenant_uuid = UUID(tenant_id)
    tenant = db.query(Tenant).filter(Tenant.id == tenant_uuid).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    db.delete(tenant)
    db.commit()
    return {"message": "Tenant deleted successfully"}
