from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from datetime import datetime, timezone

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User, UserRole
from app.models.announcement import Announcement, AnnouncementRead
from app.schemas.announcement import (
    AnnouncementCreate, 
    AnnouncementResponse, 
    AnnouncementListResponse
)
from app.schemas.discussion import AuthorBrief, CommunityBrief

router = APIRouter()

def build_announcement_response(ann: Announcement, current_user_id: str, db: Session) -> AnnouncementResponse:
    # Check read status
    is_read = db.query(AnnouncementRead).filter(
        AnnouncementRead.announcement_id == ann.id,
        AnnouncementRead.user_id == current_user_id
    ).first() is not None

    author = AuthorBrief(
        id=ann.author.id,
        email=ann.author.email,
        role=ann.author.role,
        full_name=ann.author.profile.full_name if ann.author.profile else ann.author.email,
        department=ann.author.profile.department if ann.author.profile else None,
        course=ann.author.profile.course if ann.author.profile else None,
        student_id=ann.author.profile.student_id if ann.author.profile else None,
        avatar_url=ann.author.profile.avatar_url if ann.author.profile else None,
    )

    comm_brief = None
    if ann.community:
        comm_brief = CommunityBrief(
            id=ann.community.id,
            name=ann.community.name,
            slug=ann.community.slug,
            icon_url=ann.community.icon_url,
            is_private=ann.community.is_private
        )

    return AnnouncementResponse(
        id=ann.id,
        title=ann.title,
        content=ann.content,
        priority=ann.priority,
        scope=ann.scope,
        target_department=ann.target_department,
        community_id=ann.community_id,
        is_pinned=ann.is_pinned,
        expires_at=ann.expires_at,
        created_at=ann.created_at,
        author=author,
        community=comm_brief,
        is_read=is_read
    )

@router.get("", response_model=AnnouncementListResponse)
@router.get("/", response_model=AnnouncementListResponse, include_in_schema=False)
def list_announcements(
    scope: Optional[str] = None,
    priority: Optional[str] = None,
    community_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Announcement)

    now = datetime.now(timezone.utc)
    # Filter out expired announcements
    query = query.filter((Announcement.expires_at == None) | (Announcement.expires_at >= now))

    if scope and scope != "All":
        query = query.filter(Announcement.scope == scope)

    if priority and priority != "All":
        query = query.filter(Announcement.priority == priority)

    if community_id:
        query = query.filter(Announcement.community_id == community_id)

    total = query.count()
    anns = query.order_by(
        desc(Announcement.is_pinned),
        desc(Announcement.created_at)
    ).offset(offset).limit(limit).all()

    items = [build_announcement_response(a, current_user.id, db) for a in anns]

    # Calculate unread count
    read_ann_ids = {
        r[0] for r in db.query(AnnouncementRead.announcement_id).filter(
            AnnouncementRead.user_id == current_user.id
        ).all()
    }
    unread_count = sum(1 for a in anns if a.id not in read_ann_ids)

    return AnnouncementListResponse(items=items, total=total, unread_count=unread_count)

@router.post("", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_announcement(
    ann_in: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Only faculty or admin can publish official announcements
    if current_user.role not in [UserRole.FACULTY, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only verified faculty members or administrators can broadcast official announcements."
        )

    ann = Announcement(
        title=ann_in.title,
        content=ann_in.content,
        priority=ann_in.priority,
        scope=ann_in.scope,
        target_department=ann_in.target_department,
        community_id=ann_in.community_id,
        author_id=current_user.id,
        is_pinned=ann_in.is_pinned,
        expires_at=ann_in.expires_at
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return build_announcement_response(ann, current_user.id, db)

@router.post("/{id}/read", response_model=AnnouncementResponse)
def mark_announcement_read(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    ann = db.query(Announcement).filter(Announcement.id == id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found.")

    existing_read = db.query(AnnouncementRead).filter(
        AnnouncementRead.announcement_id == ann.id,
        AnnouncementRead.user_id == current_user.id
    ).first()

    if not existing_read:
        read_record = AnnouncementRead(
            announcement_id=ann.id,
            user_id=current_user.id
        )
        db.add(read_record)
        db.commit()

    return build_announcement_response(ann, current_user.id, db)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_announcement(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    ann = db.query(Announcement).filter(Announcement.id == id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found.")

    if ann.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to delete this announcement.")

    db.delete(ann)
    db.commit()
    return None
