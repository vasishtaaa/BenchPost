from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.community import CommunityRole, MembershipStatus
from app.models.user import UserRole

class CommunityBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=10, max_length=2000)
    category: str = Field(default="General", max_length=50)
    rules: Optional[str] = Field(None, max_length=3000)
    is_private: bool = Field(default=False)
    icon_url: Optional[str] = Field(None, max_length=500)
    banner_url: Optional[str] = Field(None, max_length=500)

class CommunityCreate(CommunityBase):
    pass

class CommunityUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, min_length=10, max_length=2000)
    category: Optional[str] = Field(None, max_length=50)
    rules: Optional[str] = Field(None, max_length=3000)
    is_private: Optional[bool] = None
    icon_url: Optional[str] = Field(None, max_length=500)
    banner_url: Optional[str] = Field(None, max_length=500)

class MemberUserBrief(BaseModel):
    id: str
    email: str
    role: UserRole
    full_name: str
    student_id: Optional[str] = None
    department: Optional[str] = None
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class CommunityMemberResponse(BaseModel):
    id: str
    community_id: str
    user_id: str
    role: CommunityRole
    status: MembershipStatus
    joined_at: datetime
    user: Optional[MemberUserBrief] = None

    model_config = ConfigDict(from_attributes=True)

class CommunityResponse(CommunityBase):
    id: str
    slug: str
    creator_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    member_count: int = 0
    is_member: bool = False
    membership_status: Optional[MembershipStatus] = None
    user_role: Optional[CommunityRole] = None

    model_config = ConfigDict(from_attributes=True)

class CommunityListResponse(BaseModel):
    total: int
    items: List[CommunityResponse]
