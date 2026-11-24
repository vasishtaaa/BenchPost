from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.schemas.discussion import AuthorBrief

class PollOptionResponse(BaseModel):
    id: str
    poll_id: str
    text: str
    order: int
    vote_count: int = 0
    percentage: float = 0.0

    model_config = ConfigDict(from_attributes=True)

class PollCreate(BaseModel):
    question: str = Field(..., min_length=3, max_length=255)
    options: List[str] = Field(..., min_length=2, max_length=10)
    is_multiple_choice: bool = False
    expires_at: Optional[datetime] = None
    post_id: Optional[str] = None
    community_id: Optional[str] = None

class PollVoteRequest(BaseModel):
    option_ids: List[str] = Field(..., min_length=1)

class PollResponse(BaseModel):
    id: str
    post_id: Optional[str] = None
    community_id: Optional[str] = None
    question: str
    is_multiple_choice: bool
    expires_at: Optional[datetime] = None
    is_expired: bool = False
    total_votes: int = 0
    created_at: datetime
    created_by: AuthorBrief
    options: List[PollOptionResponse] = []
    user_voted_option_ids: List[str] = []

    model_config = ConfigDict(from_attributes=True)
