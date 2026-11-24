from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime
from app.models.discussion import ReactionType
from app.models.user import UserRole

class AuthorBrief(BaseModel):
    id: str
    email: str
    role: UserRole
    full_name: str
    department: Optional[str] = None
    course: Optional[str] = None
    student_id: Optional[str] = None
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class CommunityBrief(BaseModel):
    id: str
    name: str
    slug: str
    icon_url: Optional[str] = None
    is_private: bool = False

    model_config = ConfigDict(from_attributes=True)

class ReactionCounts(BaseModel):
    like: int = 0
    helpful: int = 0
    celebrate: int = 0
    interesting: int = 0
    total: int = 0

class PostBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    content: str = Field(..., min_length=5, max_length=20000)
    category: str = Field(default="General", max_length=50)

class PostCreate(PostBase):
    community_id: str

class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    content: Optional[str] = Field(None, min_length=5, max_length=20000)
    category: Optional[str] = Field(None, max_length=50)

class PostResponse(PostBase):
    id: str
    community_id: str
    author_id: str
    is_pinned: bool
    views_count: int
    created_at: datetime
    updated_at: datetime
    author: Optional[AuthorBrief] = None
    community: Optional[CommunityBrief] = None
    comments_count: int = 0
    reactions: ReactionCounts = Field(default_factory=ReactionCounts)
    user_reaction: Optional[ReactionType] = None
    is_bookmarked: bool = False

    model_config = ConfigDict(from_attributes=True)

class PostListResponse(BaseModel):
    total: int
    items: List[PostResponse]

# Comments
class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    parent_id: Optional[str] = None

class CommentResponse(BaseModel):
    id: str
    post_id: str
    author_id: str
    parent_id: Optional[str] = None
    content: str
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    author: Optional[AuthorBrief] = None
    replies: List["CommentResponse"] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

# Reactions & Bookmarks
class ReactionToggleInput(BaseModel):
    reaction_type: ReactionType

class ReactionToggleResponse(BaseModel):
    message: str
    current_reaction: Optional[ReactionType] = None
    reactions: ReactionCounts

class BookmarkToggleResponse(BaseModel):
    message: str
    is_bookmarked: bool
