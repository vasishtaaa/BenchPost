from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.schemas.discussion import AuthorBrief

class ReportCreate(BaseModel):
    target_type: str = Field(..., pattern="^(POST|COMMENT|USER|COMMUNITY)$")
    target_id: str
    reason: str = Field(..., min_length=2, max_length=50) # SPAM, HARASSMENT, ACADEMIC_MISCONDUCT, INAPPROPRIATE, OTHER
    details: Optional[str] = Field(None, max_length=1000)

class ReportResolveInput(BaseModel):
    action: str = Field(..., pattern="^(DISMISS|REMOVE_CONTENT|USER_WARNED)$")
    review_notes: Optional[str] = Field(None, max_length=1000)

class ReportResponse(BaseModel):
    id: str
    reporter: AuthorBrief
    target_type: str
    target_id: str
    reason: str
    details: Optional[str] = None
    status: str
    action_taken: str
    reviewer: Optional[AuthorBrief] = None
    review_notes: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ReportListResponse(BaseModel):
    items: List[ReportResponse]
    total: int
    pending_count: int

class AuditLogResponse(BaseModel):
    id: str
    actor: AuthorBrief
    action: str
    target_type: str
    target_id: str
    details: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AuditLogListResponse(BaseModel):
    items: List[AuditLogResponse]
    total: int
