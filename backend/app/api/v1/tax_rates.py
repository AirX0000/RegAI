from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import date

from app.core.deps import get_db, get_current_active_user, get_current_active_superuser
from app.db.models.tax_rate import TaxRate
from app.db.models.user import User
from app.db.schemas import tax_rate as tax_rate_schemas

router = APIRouter()

@router.get("/countries", response_model=List[dict])
def get_supported_countries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get list of countries with tax rate data.
    """
    countries = db.query(
        TaxRate.country_code,
        TaxRate.country_name
    ).distinct().all()
    
    return [
        {"code": code, "name": name}
        for code, name in countries
    ]


@router.get("/{country_code}", response_model=tax_rate_schemas.CountryTaxRates)
def get_country_tax_rates(
    country_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    active_only: bool = True,
) -> Any:
    """
    Get all tax rates for a specific country.
    """
    query = db.query(TaxRate).filter(TaxRate.country_code == country_code.upper())
    
    if active_only:
        today = date.today()
        query = query.filter(
            and_(
                TaxRate.effective_from <= today,
                (TaxRate.effective_to.is_(None)) | (TaxRate.effective_to >= today)
            )
        )
    
    rates = query.all()
    
    if not rates:
        raise HTTPException(status_code=404, detail=f"No tax rates found for country: {country_code}")
    
    return {
        "country_code": country_code.upper(),
        "country_name": rates[0].country_name,
        "rates": rates
    }


@router.get("/current/{country_code}/{tax_type}")
def get_current_rate(
    country_code: str,
    tax_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get current active tax rate for a specific country and type.
    """
    today = date.today()
    
    rate = db.query(TaxRate).filter(
        and_(
            TaxRate.country_code == country_code.upper(),
            TaxRate.tax_type == tax_type,
            TaxRate.effective_from <= today,
            (TaxRate.effective_to.is_(None)) | (TaxRate.effective_to >= today)
        )
    ).first()
    
    if not rate:
        raise HTTPException(
            status_code=404,
            detail=f"No active {tax_type} rate found for {country_code}"
        )
    
    return rate


@router.post("/", response_model=tax_rate_schemas.TaxRate)
def create_tax_rate(
    *,
    db: Session = Depends(get_db),
    tax_rate_in: tax_rate_schemas.TaxRateCreate,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    Create new tax rate (superadmin only).
    """
    import uuid
    tax_rate = TaxRate(
        id=uuid.uuid4(),
        **tax_rate_in.dict()
    )
    db.add(tax_rate)
    db.commit()
    db.refresh(tax_rate)
    return tax_rate


@router.get("/types/all")
def get_tax_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get all available tax types.
    """
    types = db.query(TaxRate.tax_type).distinct().all()
    return [{"type": t[0]} for t in types]


@router.put("/{tax_rate_id}", response_model=tax_rate_schemas.TaxRate)
def update_tax_rate(
    tax_rate_id: str,
    tax_rate_in: tax_rate_schemas.TaxRateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    Update a tax rate.
    """
    import uuid
    try:
        tax_rate_uuid = uuid.UUID(tax_rate_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")

    tax_rate = db.query(TaxRate).filter(TaxRate.id == tax_rate_uuid).first()
    if not tax_rate:
        raise HTTPException(status_code=404, detail="Tax rate not found")

    update_data = tax_rate_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tax_rate, field, value)

    db.add(tax_rate)
    db.commit()
    db.refresh(tax_rate)
    return tax_rate
