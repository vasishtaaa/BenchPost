from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional, List
from datetime import datetime, timezone

from app.core.database import get_db
from app.api.deps import require_role
from app.models.user import User, UserRole
from app.models.community import Community
from app.models.discussion import Post, Comment
from app.models.event import Event, EventRegistration
from app.models.announcement import Announcement
from app.models.moderation import Report, AuditLog
from app.schemas.admin import PlatformAnalytics, RoleDistribution, UserRoleUpdate, AdminUserResponse
from app.schemas.moderation import AuditLogResponse, AuditLogListResponse
from app.schemas.discussion import AuthorBrief

router = APIRouter()

@router.get("/analytics", response_model=PlatformAnalytics)
def get_platform_analytics(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN]))
):
    # User stats
    total_users = db.query(func.count(User.id)).scalar() or 0
    students_count = db.query(func.count(User.id)).filter(User.role == UserRole.STUDENT).scalar() or 0
    faculty_count = db.query(func.count(User.id)).filter(User.role == UserRole.FACULTY).scalar() or 0
    admins_count = db.query(func.count(User.id)).filter(User.role == UserRole.ADMIN).scalar() or 0

    # Communities
    total_communities = db.query(func.count(Community.id)).scalar() or 0
    public_comm = db.query(func.count(Community.id)).filter(Community.is_private == False).scalar() or 0
    private_comm = db.query(func.count(Community.id)).filter(Community.is_private == True).scalar() or 0

    # Discussions & Comments
    total_posts = db.query(func.count(Post.id)).scalar() or 0
    total_comments = db.query(func.count(Comment.id)).scalar() or 0

    # Events & RSVPs
    total_events = db.query(func.count(Event.id)).scalar() or 0
    total_rsvps = db.query(func.count(EventRegistration.id)).filter(
        EventRegistration.status == "CONFIRMED"
    ).scalar() or 0

    # Announcements
    total_announcements = db.query(func.count(Announcement.id)).scalar() or 0

    # Moderation
    pending_reports = db.query(func.count(Report.id)).filter(Report.status == "PENDING").scalar() or 0

    return PlatformAnalytics(
        total_users=total_users,
        role_distribution=RoleDistribution(
            students=students_count,
            faculty=faculty_count,
            admins=admins_count
        ),
        total_communities=total_communities,
        public_communities=public_comm,
        private_communities=private_comm,
        total_posts=total_posts,
        total_comments=total_comments,
        total_events=total_events,
        total_rsvps=total_rsvps,
        total_announcements=total_announcements,
        pending_reports=pending_reports
    )

@router.get("/users")
def list_all_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN]))
):
    query = db.query(User)

    if role and role != "All":
        query = query.filter(User.role == role)

    if search:
        query = query.join(User.profile).filter(
            User.email.ilike(f"%{search}%") | User.profile.has(full_name=search)
        )

    total = query.count()
    users = query.order_by(desc(User.created_at)).offset(offset).limit(limit).all()

    items = []
    for u in users:
        p = u.profile
        items.append({
            "id": u.id,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "is_verified": u.is_verified,
            "full_name": p.full_name if p else u.email,
            "department": p.department if p else None,
            "course": p.course if p else None,
            "student_id": p.student_id if p else None,
            "academic_year": p.academic_year if p else None,
            "avatar_url": p.avatar_url if p else None,
            "created_at": u.created_at.isoformat() if u.created_at else None
        })

    return {"items": items, "total": total}

@router.put("/users/{id}/role")
def update_user_role(
    id: str,
    role_in: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN]))
):
    target_user = db.query(User).filter(User.id == id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    old_role = target_user.role
    target_user.role = role_in.role

    # Create immutable audit log
    audit = AuditLog(
        actor_id=current_admin.id,
        action="UPDATE_USER_ROLE",
        target_type="USER",
        target_id=target_user.id,
        details=f"Changed role of {target_user.email} from {old_role} to {role_in.role}"
    )
    db.add(audit)
    db.commit()
    db.refresh(target_user)

    return {"message": f"User role updated to {role_in.role}."}

@router.get("/audit-logs", response_model=AuditLogListResponse)
def list_audit_logs(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN]))
):
    query = db.query(AuditLog)
    total = query.count()
    logs_raw = query.order_by(desc(AuditLog.created_at)).offset(offset).limit(limit).all()

    items = []
    for l in logs_raw:
        p = l.actor.profile if l.actor else None
        actor = AuthorBrief(
            id=l.actor.id if l.actor else "unknown",
            email=l.actor.email if l.actor else "unknown",
            role=l.actor.role if l.actor else UserRole.ADMIN,
            full_name=p.full_name if p else (l.actor.email if l.actor else "System"),
            department=p.department if p else None,
            course=p.course if p else None,
            student_id=p.student_id if p else None,
            avatar_url=p.avatar_url if p else None
        )
        items.append(AuditLogResponse(
            id=l.id,
            actor=actor,
            action=l.action,
            target_type=l.target_type,
            target_id=l.target_id,
            details=l.details,
            created_at=l.created_at
        ))

    return AuditLogListResponse(items=items, total=total)
