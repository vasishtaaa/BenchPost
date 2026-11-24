from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from datetime import datetime, timezone

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, NotificationListResponse
from app.schemas.discussion import AuthorBrief

router = APIRouter()

def build_notification_response(notif: Notification) -> NotificationResponse:
    actor_brief = None
    if notif.actor:
        p = notif.actor.profile
        actor_brief = AuthorBrief(
            id=notif.actor.id,
            email=notif.actor.email,
            role=notif.actor.role,
            full_name=p.full_name if p else notif.actor.email,
            department=p.department if p else None,
            course=p.course if p else None,
            student_id=p.student_id if p else None,
            avatar_url=p.avatar_url if p else None
        )

    return NotificationResponse(
        id=notif.id,
        title=notif.title,
        message=notif.message,
        type=notif.type,
        link=notif.link,
        is_read=notif.is_read,
        created_at=notif.created_at,
        actor=actor_brief
    )

@router.get("", response_model=NotificationListResponse)
@router.get("/", response_model=NotificationListResponse, include_in_schema=False)
def list_notifications(
    unread_only: bool = False,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)

    total = query.count()
    items_raw = query.order_by(desc(Notification.created_at)).offset(offset).limit(limit).all()

    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()

    items = [build_notification_response(n) for n in items_raw]
    return NotificationListResponse(items=items, total=total, unread_count=unread_count)

@router.post("/{id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    notif = db.query(Notification).filter(
        Notification.id == id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return build_notification_response(notif)

@router.post("/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read."}
