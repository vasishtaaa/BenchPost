import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def get_utc_now():
    return datetime.now(timezone.utc)

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reporter_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    target_type = Column(String(20), nullable=False, index=True) # POST, COMMENT, USER, COMMUNITY
    target_id = Column(String(36), nullable=False, index=True)
    reason = Column(String(50), nullable=False) # SPAM, HARASSMENT, ACADEMIC_MISCONDUCT, INAPPROPRIATE, OTHER
    details = Column(Text, nullable=True)
    status = Column(String(20), default="PENDING", nullable=False, index=True) # PENDING, RESOLVED, DISMISSED
    action_taken = Column(String(50), default="NONE", nullable=False) # NONE, CONTENT_REMOVED, USER_WARNED, DISMISSED
    reviewer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    review_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    reporter = relationship("User", foreign_keys=[reporter_id])
    reviewer = relationship("User", foreign_keys=[reviewer_id])

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(100), nullable=False, index=True) # REMOVE_POST, DELETE_COMMENT, UPDATE_USER_ROLE, DISMISS_REPORT
    target_type = Column(String(50), nullable=False)
    target_id = Column(String(36), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    # Relationships
    actor = relationship("User", foreign_keys=[actor_id])
