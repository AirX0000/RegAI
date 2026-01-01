from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, UUID4
from decimal import Decimal

class TaxRateBase(BaseModel):
    country_code: str
    country_name: str
    tax_type: str
    rate: Decimal
    description: Optional[str] = None
    effective_from: date
    effective_to: Optional[date] = None
    source_url: Optional[str] = None

class TaxRateCreate(TaxRateBase):
    pass

class TaxRateUpdate(BaseModel):
    rate: Optional[Decimal] = None
    description: Optional[str] = None
    effective_to: Optional[date] = None
    source_url: Optional[str] = None

class TaxRate(TaxRateBase):
    id: UUID4
    last_updated: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class CountryTaxRates(BaseModel):
    country_code: str
    country_name: str
    rates: List[TaxRate]
