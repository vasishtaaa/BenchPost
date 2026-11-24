import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

def get_utc_now():
    return datetime.now(timezone.utc)

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    priority = Column(String(20), default="NORMAL", nullable=False, index=True)  # LOW, NORMAL, HIGH, URGENT
    scope = Column(String(20), default="GLOBAL", nullable=False, index=True)      # GLOBAL, DEPARTMENT, COMMUNITY
    target_department = Column(String(100), nullable=True)
    community_id = Column(String(36), ForeignKey("communities.id", ondelete="CASCADE"), nullable=True, index=True)
    author_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    is_pinned = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    author = relationship("User")
    community = relationship("Community")
    reads = relationship("AnnouncementRead", back_populates="announcement", cascade="all, delete-orphan")

class AnnouncementRead(Base):
    __tablename__ = "announcement_reads"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    announcement_id = Column(String(36), ForeignKey("announcements.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("announcement_id", "user_id", name="uq_announcement_user_read"),
    )

    # Relationships
    announcement = relationship("Announcement", back_populates="reads")
    user = relationship("User")
