from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.user import UserRole
from app.core.config import settings

# Shared User Profile properties
class UserProfileBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    student_id: Optional[str] = Field(None, max_length=50)
    department: Optional[str] = Field(None, max_length=100)
    course: Optional[str] = Field(None, max_length=100)
    academic_year: Optional[int] = Field(None, ge=1, le=5)
    avatar_url: Optional[str] = Field(None, max_length=500)
    bio: Optional[str] = Field(None, max_length=1000)

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    department: Optional[str] = Field(None, max_length=100)
    course: Optional[str] = Field(None, max_length=100)
    academic_year: Optional[int] = Field(None, ge=1, le=5)
    avatar_url: Optional[str] = Field(None, max_length=500)
    bio: Optional[str] = Field(None, max_length=1000)

class UserProfileResponse(UserProfileBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Registration schema
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    full_name: str = Field(..., min_length=2, max_length=255)
    student_id: Optional[str] = Field(None, max_length=50)
    department: Optional[str] = Field(None, max_length=100)
    course: Optional[str] = Field(None, max_length=100)
    academic_year: Optional[int] = Field(None, ge=1, le=5)
    role: UserRole = Field(default=UserRole.STUDENT)

    @field_validator("email")
    @classmethod
    def validate_university_email(cls, v: str) -> str:
        if settings.REQUIRE_UNIVERSITY_DOMAIN:
            domain = v.split("@")[-1].lower()
            if not any(domain.endswith(allowed.lower()) for allowed in settings.ALLOWED_UNIVERSITY_DOMAINS):
                raise ValueError(f"Email must belong to an approved university domain: {settings.ALLOWED_UNIVERSITY_DOMAINS}")
        return v.lower()

# Login schema
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Password change schema
class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)

# Output user schema
class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    profile: Optional[UserProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)

# JWT Token Response
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
