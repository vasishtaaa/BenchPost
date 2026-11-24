from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.schemas.discussion import AuthorBrief, CommunityBrief

class EventBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10, max_length=10000)
    category: str = Field(default="WORKSHOP", max_length=50)
    venue: str = Field(..., min_length=2, max_length=255)
    start_time: datetime
    end_time: datetime
    registration_deadline: Optional[datetime] = None
    max_capacity: int = Field(default=100, ge=1, le=50000)
    banner_url: Optional[str] = None
    community_id: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, min_length=10, max_length=10000)
    category: Optional[str] = None
    venue: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    max_capacity: Optional[int] = Field(None, ge=1, le=50000)
    banner_url: Optional[str] = None
    status: Optional[str] = None

class EventResponse(EventBase):
    id: str
    organizer: AuthorBrief
    community: Optional[CommunityBrief] = None
    current_registrations: int = 0
    remaining_capacity: int = 0
    is_full: bool = False
    is_registration_open: bool = True
    status: str = "PUBLISHED"
    is_registered: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class EventAttendeeResponse(BaseModel):
    user: AuthorBrief
    status: str
    registered_at: datetime

    model_config = ConfigDict(from_attributes=True)

class EventListResponse(BaseModel):
    items: List[EventResponse]
    total: int
