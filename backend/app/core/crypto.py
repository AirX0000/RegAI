import base64
import hashlib
import logging
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken
from app.core.config import settings

logger = logging.getLogger(__name__)

def _get_fernet_key() -> bytes:
    """
    Derive a 32-byte url-safe base64 Fernet key deterministically from the app SECRET_KEY.
    """
    secret_bytes = settings.SECRET_KEY.encode('utf-8')
    key_32 = hashlib.sha256(secret_bytes).digest()
    return base64.urlsafe_b64encode(key_32)

def encrypt_secret(plaintext: Optional[str]) -> Optional[str]:
    """
    Encrypt a plaintext string using Fernet (AES-128-CBC + HMAC-SHA256).
    Returns None if input is None or empty.
    """
    if not plaintext:
        return None
    try:
        f = Fernet(_get_fernet_key())
        encrypted_bytes = f.encrypt(plaintext.encode('utf-8'))
        return encrypted_bytes.decode('utf-8')
    except Exception as e:
        logger.error(f"Error encrypting secret: {e}")
        # Fallback to plain text with warning if encryption fails
        return plaintext

def decrypt_secret(ciphertext: Optional[str]) -> Optional[str]:
    """
    Decrypt a Fernet encrypted string.
    If the text is not Fernet-encrypted (e.g. legacy plain text), returns as is.
    """
    if not ciphertext:
        return None
    try:
        f = Fernet(_get_fernet_key())
        decrypted_bytes = f.decrypt(ciphertext.encode('utf-8'))
        return decrypted_bytes.decode('utf-8')
    except (InvalidToken, ValueError):
        # Legacy plain text or unencrypted string fallback
        return ciphertext
    except Exception as e:
        logger.error(f"Error decrypting secret: {e}")
        return ciphertext
