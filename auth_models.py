from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Request Models
class UserSignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securepassword123",
                "full_name": "John Doe"
            }
        }

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securepassword123"
            }
        }

# Response Models
class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    email_confirmed: bool = False
    created_at: Optional[str] = None

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class MessageResponse(BaseModel):
    message: str