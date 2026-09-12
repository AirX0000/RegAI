import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt

logger = logging.getLogger(__name__)

# Monkey-patch bcrypt.__about__ for passlib compatibility in Python 3.12+
try:
    import bcrypt
    if not hasattr(bcrypt, "__about__"):
        class _About:
            __version__ = getattr(bcrypt, "__version__", "4.0.1")
        bcrypt.__about__ = _About()
except Exception as e:
    logger.warning(f"Could not patch bcrypt for passlib: {e}")

from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None, claims: dict = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    if claims:
        to_encode.update(claims)
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    # Safe 72-byte truncation for bcrypt/passlib
    safe_bytes = plain_password.encode('utf-8')[:72]
    # 1. Try direct bcrypt verification first (fast, standard, error-free)
    try:
        import bcrypt
        hash_bytes = hashed_password.encode('utf-8') if isinstance(hashed_password, str) else hashed_password
        return bcrypt.checkpw(safe_bytes, hash_bytes)
    except Exception as e:
        logger.debug(f"Direct bcrypt verification fallback: {e}")
    
    # 2. Fallback to passlib verification
    try:
        return pwd_context.verify(safe_bytes.decode('utf-8', errors='ignore'), hashed_password)
    except Exception as e:
        logger.warning(f"Passlib verification fallback: {e}")
        return False

def get_password_hash(password: str) -> str:
    if len(password.encode('utf-8')) > 72:
        raise ValueError("Password too long (max 72 bytes)")
    # 1. Try direct bcrypt hash (fast, standard, error-free)
    try:
        import bcrypt
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    except Exception as e:
        logger.debug(f"Direct bcrypt hash fallback: {e}")
    # 2. Fallback to passlib
    return pwd_context.hash(password)
