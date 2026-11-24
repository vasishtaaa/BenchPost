from pydantic import BaseModel
from typing import List, Optional
from app.models.user import UserRole
from app.schemas.discussion import AuthorBrief

class RoleDistribution(BaseModel):
    students: int
    faculty: int
    admins: int

class PlatformAnalytics(BaseModel):
    total_users: int
    role_distribution: RoleDistribution
    total_communities: int
    public_communities: int
    private_communities: int
    total_posts: int
    total_comments: int
    total_events: int
    total_rsvps: int
    total_announcements: int
    pending_reports: int

class UserRoleUpdate(BaseModel):
    role: UserRole

class AdminUserResponse(AuthorBrief):
    is_active: bool
    is_verified: bool
    created_at: str
