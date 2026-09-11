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

# --- IFRS 9 (Expected Credit Loss - ECL) ---

class IFRS9Input(BaseModel):
    ead: float = Field(..., gt=0, description="Exposure at Default (Gross carrying amount of receivable/loan)")
    pd_percentage: float = Field(..., ge=0, le=100, description="Probability of Default (%)")
    lgd_percentage: float = Field(45.0, ge=0, le=100, description="Loss Given Default (%, default 45% Basel foundation)")
    discount_rate_annual: float = Field(0.0, ge=0, description="Effective Interest Rate for discounting (annual %)")
    days_past_due: int = Field(0, ge=0, description="Days past due / arrears")
    horizon_years: float = Field(1.0, gt=0, description="Time horizon in years (1.0 for 12m ECL, or lifetime)")

class IFRS9Result(BaseModel):
    ecl_amount: float
    stage: str
    stage_description: str
    discount_factor: float
    net_carrying_amount: float
    effective_loss_rate_pct: float

@router.post("/ifrs9", response_model=IFRS9Result)
def calculate_ifrs9(data: IFRS9Input) -> Any:
    """
    Calculate IFRS 9 Expected Credit Loss (ECL).
    Formula: ECL = EAD * (PD / 100) * (LGD / 100) * DF
    Determines staging based on Days Past Due:
      - Stage 1 (0-30 days): 12-month ECL (Performing)
      - Stage 2 (31-90 days): Lifetime ECL (Significant Increase in Credit Risk - SICR)
      - Stage 3 (>90 days): Lifetime ECL (Credit-Impaired / Default)
    """
    # 1. Determine Stage
    if data.days_past_due <= 30:
        stage = "Stage 1"
        stage_desc = "Performing: 12-Month Expected Credit Loss (Low credit risk, standard provisioning)"
        horizon = min(data.horizon_years, 1.0)
    elif data.days_past_due <= 90:
        stage = "Stage 2"
        stage_desc = "Underperforming (SICR): Lifetime Expected Credit Loss (Significant increase in credit risk)"
        horizon = max(data.horizon_years, 2.0)
    else:
        stage = "Stage 3"
        stage_desc = "Credit-Impaired (Default): Lifetime ECL with objective evidence of impairment"
        horizon = max(data.horizon_years, 3.0)

    # 2. Compute Discount Factor
    r = data.discount_rate_annual / 100.0
    if r > 0 and horizon > 0:
        df = 1.0 / math.pow(1.0 + r, horizon)
    else:
        df = 1.0

    # 3. Compute ECL = EAD * PD * LGD * DF
    pd_dec = data.pd_percentage / 100.0
    lgd_dec = data.lgd_percentage / 100.0
    
    ecl = data.ead * pd_dec * lgd_dec * df
    ecl = round(min(ecl, data.ead), 2)
    net_amount = round(data.ead - ecl, 2)
    loss_rate = round((ecl / data.ead) * 100.0, 2) if data.ead > 0 else 0.0

    return {
        "ecl_amount": ecl,
        "stage": stage,
        "stage_description": stage_desc,
        "discount_factor": round(df, 4),
        "net_carrying_amount": net_amount,
        "effective_loss_rate_pct": loss_rate
    }

