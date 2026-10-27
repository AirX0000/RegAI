from typing import Optional
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    tid: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ForgotPasswordResponse(BaseModel):
    status: str
    message: str
    expires_in_minutes: int = 15
    demo_reset_code: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    email: str
    reset_code: str
    new_password: str

