from typing import Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import math

router = APIRouter()

# --- IFRS 16 ---

class IFRS16Input(BaseModel):
    lease_term_months: int = Field(..., gt=0, description="Duration of the lease in months")
    discount_rate_annual: float = Field(..., gt=0, description="Annual discount rate (percentage)")
    monthly_payment: float = Field(..., gt=0, description="Monthly lease payment amount")
    initial_direct_costs: float = Field(0, ge=0, description="Initial direct costs incurred by the lessee")

class IFRS16Result(BaseModel):
    lease_liability: float
    right_of_use_asset: float
    monthly_discount_rate: float
    total_payments: float

@router.post("/ifrs16", response_model=IFRS16Result)
def calculate_ifrs16(data: IFRS16Input) -> Any:
    """
    Calculate IFRS 16 Right-of-Use Asset and Lease Liability.
    Uses Present Value (PV) of an ordinary annuity for the lease liability.
    """
    r_monthly = (data.discount_rate_annual / 100) / 12
    n = data.lease_term_months
    pmt = data.monthly_payment

    if r_monthly > 0:
        # PV of ordinary annuity
        pv = pmt * ((1 - math.pow(1 + r_monthly, -n)) / r_monthly)
    else:
        pv = pmt * n
        
    pv = round(pv, 2)
    rou_asset = round(pv + data.initial_direct_costs, 2)
    
    return {
        "lease_liability": pv,
        "right_of_use_asset": rou_asset,
        "monthly_discount_rate": round(r_monthly, 6),
        "total_payments": round(pmt * n, 2)
    }

# --- IAS 36 ---

class IAS36Input(BaseModel):
    carrying_amount: float = Field(..., ge=0, description="Current carrying amount of the asset/CGU")
    fair_value_less_costs: float = Field(0, ge=0, description="Fair value less costs of disposal")
    value_in_use: float = Field(0, ge=0, description="Value in use (Present value of future cash flows)")

class IAS36Result(BaseModel):
    recoverable_amount: float
    impairment_loss: float
    new_carrying_amount: float
    is_impaired: bool

@router.post("/ias36", response_model=IAS36Result)
def calculate_ias36(data: IAS36Input) -> Any:
    """
    Calculate IAS 36 Impairment Loss.
    Recoverable Amount = Max(Fair Value Less Costs, Value in Use)
    Impairment Loss = Carrying Amount - Recoverable Amount (if > 0)
    """
    recoverable_amount = max(data.fair_value_less_costs, data.value_in_use)
    
    if data.carrying_amount > recoverable_amount:
        impairment_loss = data.carrying_amount - recoverable_amount
        is_impaired = True
    else:
        impairment_loss = 0.0
        is_impaired = False
        
    return {
        "recoverable_amount": round(recoverable_amount, 2),
        "impairment_loss": round(impairment_loss, 2),
        "new_carrying_amount": round(data.carrying_amount - impairment_loss, 2),
        "is_impaired": is_impaired
    }
