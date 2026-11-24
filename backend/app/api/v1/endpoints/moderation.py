from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from datetime import datetime, timezone

from app.core.database import get_db
from app.api.deps import get_current_active_user, require_role
from app.models.user import User, UserRole
from app.models.discussion import Post, Comment
from app.models.moderation import Report, AuditLog
from app.models.notification import Notification
from app.schemas.moderation import (
    ReportCreate, 
    ReportResolveInput, 
    ReportResponse, 
    ReportListResponse
)
from app.schemas.discussion import AuthorBrief

router = APIRouter()

def build_report_response(r: Report) -> ReportResponse:
    rp = r.reporter.profile if r.reporter else None
    reporter = AuthorBrief(
        id=r.reporter.id if r.reporter else "unknown",
        email=r.reporter.email if r.reporter else "unknown",
        role=r.reporter.role if r.reporter else UserRole.STUDENT,
        full_name=rp.full_name if rp else (r.reporter.email if r.reporter else "Anonymous"),
        department=rp.department if rp else None,
        course=rp.course if rp else None,
        student_id=rp.student_id if rp else None,
        avatar_url=rp.avatar_url if rp else None
    )

    reviewer = None
    if r.reviewer:
        rev_p = r.reviewer.profile
        reviewer = AuthorBrief(
            id=r.reviewer.id,
            email=r.reviewer.email,
            role=r.reviewer.role,
            full_name=rev_p.full_name if rev_p else r.reviewer.email,
            department=rev_p.department if rev_p else None,
            course=rev_p.course if rev_p else None,
            student_id=rev_p.student_id if rev_p else None,
            avatar_url=rev_p.avatar_url if rev_p else None
        )

    return ReportResponse(
        id=r.id,
        reporter=reporter,
        target_type=r.target_type,
        target_id=r.target_id,
        reason=r.reason,
        details=r.details,
        status=r.status,
        action_taken=r.action_taken,
        reviewer=reviewer,
        review_notes=r.review_notes,
        created_at=r.created_at,
        reviewed_at=r.reviewed_at
    )

@router.post("/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    report_in: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify target exists
    if report_in.target_type == "POST":
        post = db.query(Post).filter(Post.id == report_in.target_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Reported post does not exist.")
    elif report_in.target_type == "COMMENT":
        comment = db.query(Comment).filter(Comment.id == report_in.target_id).first()
        if not comment:
            raise HTTPException(status_code=404, detail="Reported comment does not exist.")

    report = Report(
        reporter_id=current_user.id,
        target_type=report_in.target_type,
        target_id=report_in.target_id,
        reason=report_in.reason,
        details=report_in.details,
        status="PENDING",
        action_taken="NONE"
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return build_report_response(report)

@router.get("/reports", response_model=ReportListResponse)
def list_reports(
    status_filter: Optional[str] = Query(None, alias="status"),
    target_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN, UserRole.FACULTY]))
):
    query = db.query(Report)
    if status_filter and status_filter != "All":
        query = query.filter(Report.status == status_filter)

    if target_type and target_type != "All":
        query = query.filter(Report.target_type == target_type)

    total = query.count()
    pending_count = db.query(Report).filter(Report.status == "PENDING").count()
    reports = query.order_by(desc(Report.created_at)).offset(offset).limit(limit).all()

    items = [build_report_response(r) for r in reports]
    return ReportListResponse(items=items, total=total, pending_count=pending_count)

@router.post("/reports/{id}/resolve", response_model=ReportResponse)
def resolve_report(
    id: str,
    resolve_in: ReportResolveInput,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN, UserRole.FACULTY]))
):
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    now = datetime.now(timezone.utc)
    report.status = "RESOLVED" if resolve_in.action != "DISMISS" else "DISMISSED"
    report.action_taken = resolve_in.action
    report.reviewer_id = current_admin.id
    report.review_notes = resolve_in.review_notes
    report.reviewed_at = now

    # Content removal action
    if resolve_in.action == "REMOVE_CONTENT":
        if report.target_type == "POST":
            post = db.query(Post).filter(Post.id == report.target_id).first()
            if post:
                post.title = "[Removed by Moderation]"
                post.content = "This discussion post was removed for violating community guidelines."
        elif report.target_type == "COMMENT":
            comment = db.query(Comment).filter(Comment.id == report.target_id).first()
            if comment:
                comment.is_deleted = True
                comment.content = "[This comment was removed by moderation]"

    # Audit Log
    audit = AuditLog(
        actor_id=current_admin.id,
        action=f"MODERATION_{resolve_in.action}",
        target_type=report.target_type,
        target_id=report.target_id,
        details=f"Report {report.id} resolved with action {resolve_in.action}. Notes: {resolve_in.review_notes or 'None'}"
    )
    db.add(audit)

    # Notify reporter
    notif = Notification(
        user_id=report.reporter_id,
        actor_id=current_admin.id,
        title="Report Update",
        message=f"Your report regarding a {report.target_type.lower()} has been reviewed and marked as {report.status.lower()}.",
        type="REPORT_RESOLVED"
    )
    db.add(notif)

    db.commit()
    db.refresh(report)
    return build_report_response(report)
