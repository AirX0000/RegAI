import uuid
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_active_user
from app.db.models.user import User
from app.db.models.company import Company
from app.db.models.onec_connection import OneCConnection
from app.db.schemas.onec import (
    OneCConnectionResponse,
    OneCConnectionCreate,
    OneCConnectionUpdate,
    OneCTestRequest,
    OneCTestResponse,
    TrialBalanceFilterRequest,
    TrialBalanceResponse,
    ExportAdjustmentsRequest,
    ExportAdjustmentsResponse,
    OneCSyncLogResponse
)
from app.services.onec_service import OneCService

router = APIRouter()

def get_user_company_id(
    db: Session, 
    current_user: User,
    company_id: Optional[str] = None
) -> uuid.UUID:
    """
    Get the company ID associated with the user, query param, or tenant fallback.
    """
    if company_id:
        try:
            return uuid.UUID(company_id)
        except ValueError:
            pass

    if current_user.company_id:
        return current_user.company_id
    
    if current_user.tenant_id:
        company = db.query(Company).filter(Company.tenant_id == current_user.tenant_id).first()
        if company:
            return company.id
            
    first_company = db.query(Company).first()
    if first_company:
        return first_company.id
        
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="No company found for your account. Please configure a company first."
    )


@router.get("/config", response_model=OneCConnectionResponse)
def get_onec_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve the 1C connection configuration for current company (credentials masked).
    """
    company_id = get_user_company_id(db, current_user)
    conn = OneCService.get_connection(db, company_id)
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="1C connection config not found for this company"
        )
    
    return OneCConnectionResponse(
        id=conn.id,
        company_id=conn.company_id,
        url=conn.url,
        auth_type=conn.auth_type or "basic",
        username=conn.username,
        company_code=conn.company_code,
        verify_ssl=conn.verify_ssl if conn.verify_ssl is not None else True,
        status=conn.status or "disconnected",
        last_sync=conn.last_sync,
        last_latency_ms=conn.last_latency_ms,
        last_error=conn.last_error,
        has_password=bool(conn.password),
        has_token=bool(conn.api_token),
        created_at=conn.created_at,
        updated_at=conn.updated_at
    )


@router.post("/config", response_model=OneCConnectionResponse)
def save_onec_config(
    config_in: OneCConnectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create or update encrypted 1C OData connection parameters.
    """
    company_id = get_user_company_id(db, current_user)
    conn = OneCService.save_connection(
        db=db,
        company_id=company_id,
        url=config_in.url,
        auth_type=config_in.auth_type,
        username=config_in.username,
        password=config_in.password,
        api_token=config_in.api_token,
        company_code=config_in.company_code,
        verify_ssl=config_in.verify_ssl
    )
    
    return OneCConnectionResponse(
        id=conn.id,
        company_id=conn.company_id,
        url=conn.url,
        auth_type=conn.auth_type,
        username=conn.username,
        company_code=conn.company_code,
        verify_ssl=conn.verify_ssl,
        status=conn.status,
        last_sync=conn.last_sync,
        last_latency_ms=conn.last_latency_ms,
        last_error=conn.last_error,
        has_password=bool(conn.password),
        has_token=bool(conn.api_token),
        created_at=conn.created_at,
        updated_at=conn.updated_at
    )


@router.post("/test", response_model=OneCTestResponse)
@router.post("/test-connection", response_model=OneCTestResponse)
async def test_onec_connection(
    test_in: Optional[OneCTestRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Test ping and latency against 1C:Enterprise OData metadata service.
    """
    company_id = get_user_company_id(db, current_user)
    conn = OneCService.get_connection(db, company_id)
    
    if not conn and not test_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No connection configuration provided or saved."
        )

    if not conn:
        # Temporary in-memory connection
        conn = OneCConnection(
            company_id=company_id,
            url=test_in.url,
            auth_type=test_in.auth_type,
            username=test_in.username,
            company_code=test_in.company_code,
            verify_ssl=test_in.verify_ssl
        )
        if test_in.password:
            conn.set_password(test_in.password)
        if test_in.api_token:
            conn.set_api_token(test_in.api_token)

    test_override = test_in.dict() if test_in else None
    result = await OneCService.test_connection(db, conn, test_override)
    return result


@router.post("/sync-trial-balance", response_model=TrialBalanceResponse)
@router.post("/sync", response_model=TrialBalanceResponse)
async def sync_trial_balance(
    request: Optional[TrialBalanceFilterRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Trigger Data Ingestion (1C -> RegAI):
    Fetches trial balance / GL turnovers and creates/updates RegAI balance sheet.
    """
    company_id = get_user_company_id(db, current_user)
    req = request or TrialBalanceFilterRequest()
    
    try:
        response = await OneCService.sync_trial_balance(
            db=db,
            company_id=company_id,
            current_user=current_user,
            request=req
        )
        return response
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"1C Sync failed: {str(e)}")


@router.post("/export-adjustments", response_model=ExportAdjustmentsResponse)
async def export_adjustments_to_onec(
    request: ExportAdjustmentsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Trigger Two-Way Pushback (RegAI -> 1C):
    Exports approved IFRS adjustments into 1C as Document_ОперацияБух.
    """
    company_id = get_user_company_id(db, current_user)
    
    try:
        response = await OneCService.export_adjustments(
            db=db,
            company_id=company_id,
            current_user=current_user,
            request=request
        )
        return response
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"1C Export failed: {str(e)}")


@router.get("/logs", response_model=List[OneCSyncLogResponse])
def get_onec_sync_logs(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Fetch integration sync audit history for current company.
    """
    company_id = get_user_company_id(db, current_user)
    logs = OneCService.get_sync_logs(db, company_id, limit=limit, skip=skip)
    return logs
