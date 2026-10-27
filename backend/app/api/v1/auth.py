import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Tuple
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core import security, deps
from app.core.config import settings
from app.core.deps import get_db
from app.core.rate_limit import check_login_rate_limit
from app.db.models.audit_log import AuditLog
from app.db.models.user import User
from app.db.schemas import auth as auth_schemas

router = APIRouter()

# In-memory store for short-lived 6-digit password reset codes: {email: (code, expires_at_utc)}
_PASSWORD_RESET_CODES: Dict[str, Tuple[str, datetime]] = {}


def _resolve_user_by_email(db: Session, raw_email: str) -> User | None:
    input_username = raw_email.strip().lower()
    candidates = [input_username]
    if "@" in input_username:
        prefix, _ = input_username.split("@", 1)
        for domain in ["regai.ai", "axiaris.ai", "regai.demo", "finbridge.demo"]:
            candidates.append(f"{prefix}@{domain}")
    else:
        for domain in ["regai.ai", "axiaris.ai", "regai.demo", "finbridge.demo"]:
            candidates.append(f"{input_username}@{domain}")
    return db.query(User).filter(User.email.in_(candidates)).first()


@router.post("/login", response_model=auth_schemas.Token)
def login_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
    _: None = Depends(check_login_rate_limit),
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    input_username = form_data.username.strip().lower()
    candidates = [input_username]
    if "@" in input_username:
        prefix, _ = input_username.split("@", 1)
        for domain in ["regai.ai", "regai.demo", "finbridge.demo"]:
            candidates.append(f"{prefix}@{domain}")
    else:
        for domain in ["regai.ai", "regai.demo", "finbridge.demo"]:
            candidates.append(f"{input_username}@{domain}")

    user = db.query(User).filter(User.email.in_(candidates)).first()
    if not user:
        # Timing attack mitigation
        security.verify_password("fake", "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxwKc.60VFE/AtzpvVSVPqkhL.yO.")
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # Secure password verification: check bcrypt hash first
    is_valid_pw = security.verify_password(form_data.password, user.hashed_password)
    # Safe demo fallback: strictly forbidden in production, only allowed in dev/staging when ALLOW_DEMO_LOGIN is explicitly enabled
    is_production = getattr(settings, "ENVIRONMENT", "").lower() == "production"
    if not is_valid_pw and not is_production and getattr(settings, "ALLOW_DEMO_LOGIN", False) and not user.is_superuser:
        if form_data.password in ["FinBridge2026!", "RegAI2026!"]:
            is_valid_pw = True

    if not is_valid_pw:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    claims = {"role": user.role}
    if hasattr(user, 'tenant_id') and user.tenant_id:
        claims["tid"] = str(user.tenant_id)
    if hasattr(user, 'company_id') and user.company_id:
        claims["cid"] = str(user.company_id)
    
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires,
            claims=claims
        ),
        "token_type": "bearer",
    }

@router.post("/refresh", response_model=auth_schemas.Token)
def refresh_access_token(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Refresh current user's JWT access token with a renewed expiration window.
    Allows frontend session to remain seamlessly alive during active usage.
    """
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    claims = {"role": current_user.role}
    if hasattr(current_user, 'tenant_id') and current_user.tenant_id:
        claims["tid"] = str(current_user.tenant_id)
    if hasattr(current_user, 'company_id') and current_user.company_id:
        claims["cid"] = str(current_user.company_id)
    
    return {
        "access_token": security.create_access_token(
            current_user.id, expires_delta=access_token_expires,
            claims=claims
        ),
        "token_type": "bearer",
    }

@router.post("/login/json", response_model=auth_schemas.Token)
def login_access_token_json(
    login_req: auth_schemas.LoginRequest,
    db: Session = Depends(get_db),
    _rate_limit: None = Depends(check_login_rate_limit),
) -> Any:
    """
    JSON login endpoint
    """
    input_username = login_req.username.strip().lower()
    candidates = [input_username]
    if "@" in input_username:
        prefix, _ = input_username.split("@", 1)
        for domain in ["regai.ai", "regai.demo", "finbridge.demo"]:
            candidates.append(f"{prefix}@{domain}")
    else:
        for domain in ["regai.ai", "regai.demo", "finbridge.demo"]:
            candidates.append(f"{input_username}@{domain}")

    user = db.query(User).filter(User.email.in_(candidates)).first()
    if not user:
        security.verify_password("fake", "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxwKc.60VFE/AtzpvVSVPqkhL.yO.")
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # Secure password verification: check bcrypt hash first
    is_valid_pw = security.verify_password(login_req.password, user.hashed_password)
    # Safe demo fallback: strictly forbidden in production, only allowed in dev/staging when ALLOW_DEMO_LOGIN is explicitly enabled
    is_production = getattr(settings, "ENVIRONMENT", "").lower() == "production"
    if not is_valid_pw and not is_production and getattr(settings, "ALLOW_DEMO_LOGIN", False) and not user.is_superuser:
        if login_req.password in ["FinBridge2026!", "RegAI2026!"]:
            is_valid_pw = True

    if not is_valid_pw:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    claims = {"role": user.role}
    if hasattr(user, 'tenant_id') and user.tenant_id:
        claims["tid"] = str(user.tenant_id)
    if hasattr(user, 'company_id') and user.company_id:
        claims["cid"] = str(user.company_id)
    
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires,
            claims=claims
        ),
        "token_type": "bearer",
    }

@router.post("/forgot-password", response_model=auth_schemas.ForgotPasswordResponse)
def forgot_password(
    payload: auth_schemas.ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
    _rate_limit: None = Depends(check_login_rate_limit),
) -> Any:
    """
    Initiate password recovery for a user account and generate a 15-minute 6-digit verification code.
    """
    normalized_email = payload.email.strip().lower()
    if not normalized_email or "@" not in normalized_email:
        raise HTTPException(status_code=400, detail="Введите корректный корпоративный Email")

    user = _resolve_user_by_email(db, normalized_email)
    reset_code = f"{secrets.randbelow(900000) + 100000:06d}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

    # Store code keyed by both input email and canonical DB email if found
    _PASSWORD_RESET_CODES[normalized_email] = (reset_code, expires_at)
    if user:
        _PASSWORD_RESET_CODES[user.email.lower()] = (reset_code, expires_at)
        if getattr(user, "tenant_id", None):
            try:
                with db.begin_nested():
                    client_ip = request.client.host if request.client else "127.0.0.1"
                    db.add(
                        AuditLog(
                            tenant_id=user.tenant_id,
                            user_id=user.id,
                            action="password_reset_requested",
                            resource_type="user",
                            resource_id=str(user.id),
                            ip_address=client_ip,
                            details=json.dumps({"email": user.email, "expires_in_minutes": 15}),
                        )
                    )
                    db.flush()
                db.commit()
            except Exception:
                pass

    return {
        "status": "success",
        "message": "Код восстановления пароля сформирован (действителен 15 минут).",
        "expires_in_minutes": 15,
        "demo_reset_code": reset_code,
    }


@router.post("/reset-password")
def reset_password(
    payload: auth_schemas.ResetPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
    _rate_limit: None = Depends(check_login_rate_limit),
) -> Any:
    """
    Verify the 6-digit recovery code and set a new password for the user account.
    """
    normalized_email = payload.email.strip().lower()
    code_input = payload.reset_code.strip()
    new_password = payload.new_password

    if len(new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Новый пароль должен содержать минимум 8 символов",
        )

    user = _resolve_user_by_email(db, normalized_email)
    record = _PASSWORD_RESET_CODES.get(normalized_email) or (
        _PASSWORD_RESET_CODES.get(user.email.lower()) if user else None
    )

    now_utc = datetime.now(timezone.utc)
    if not record or record[1] < now_utc or not secrets.compare_digest(record[0], code_input):
        raise HTTPException(
            status_code=400,
            detail="Неверный или просроченный код восстановления",
        )

    # Consume one-time code
    _PASSWORD_RESET_CODES.pop(normalized_email, None)
    if user:
        _PASSWORD_RESET_CODES.pop(user.email.lower(), None)
        user.hashed_password = security.get_password_hash(new_password)
        db.commit()
        if getattr(user, "tenant_id", None):
            try:
                with db.begin_nested():
                    client_ip = request.client.host if request.client else "127.0.0.1"
                    db.add(
                        AuditLog(
                            tenant_id=user.tenant_id,
                            user_id=user.id,
                            action="password_reset_completed",
                            resource_type="user",
                            resource_id=str(user.id),
                            ip_address=client_ip,
                            details=json.dumps({"email": user.email, "status": "password_updated"}),
                        )
                    )
                    db.flush()
                db.commit()
            except Exception:
                pass

    return {
        "status": "success",
        "message": "Пароль успешно обновлен. Теперь вы можете войти с новым паролем.",
    }


@router.get("/.well-known/jwks.json")
def get_jwks():
    """
    Mock JWKS endpoint for OIDC compatibility if needed
    """
    return {"keys": []}
