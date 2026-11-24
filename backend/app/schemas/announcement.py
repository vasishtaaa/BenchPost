from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.schemas.discussion import AuthorBrief, CommunityBrief

class AnnouncementBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    content: str = Field(..., min_length=10, max_length=10000)
    priority: str = Field(default="NORMAL", max_length=20)  # LOW, NORMAL, HIGH, URGENT
    scope: str = Field(default="GLOBAL", max_length=20)      # GLOBAL, DEPARTMENT, COMMUNITY
    target_department: Optional[str] = Field(None, max_length=100)
    community_id: Optional[str] = None
    is_pinned: bool = False
    expires_at: Optional[datetime] = None

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementResponse(AnnouncementBase):
    id: str
    author: AuthorBrief
    community: Optional[CommunityBrief] = None
    is_read: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AnnouncementListResponse(BaseModel):
    items: List[AnnouncementResponse]
    total: int
    unread_count: int = 0
