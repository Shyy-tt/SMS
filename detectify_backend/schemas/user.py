from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional

class RegisterRequest(BaseModel):
    full_name: str
    email:     EmailStr
    password:  str
    # phone: Optional[str] = None  # REMOVED - not needed for SMS scam detector

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

class UserResponse(BaseModel):
    id:         UUID
    full_name:  str
    email:      str
    # phone: Optional[str]  # REMOVED
    plan:       str
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         UserResponse