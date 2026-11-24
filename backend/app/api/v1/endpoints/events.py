from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import Optional, List
from datetime import datetime, timezone

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User, UserRole
from app.models.event import Event, EventRegistration
from app.schemas.event import (
    EventCreate, 
    EventUpdate, 
    EventResponse, 
    EventListResponse, 
    EventAttendeeResponse
)
from app.schemas.discussion import AuthorBrief, CommunityBrief

router = APIRouter()

def build_event_response(event: Event, current_user_id: str, db: Session) -> EventResponse:
    now = datetime.now(timezone.utc)
    
    # Check registration status for current user
    user_reg = db.query(EventRegistration).filter(
        EventRegistration.event_id == event.id,
        EventRegistration.user_id == current_user_id,
        EventRegistration.status == "CONFIRMED"
    ).first()
    is_registered = user_reg is not None

    # Check capacity and registration openness
    remaining = max(0, event.max_capacity - event.current_registrations)
    is_full = event.current_registrations >= event.max_capacity

    deadline = event.registration_deadline
    if deadline and not deadline.tzinfo:
        deadline = deadline.replace(tzinfo=timezone.utc)
    
    end_time = event.end_time
    if end_time and not end_time.tzinfo:
        end_time = end_time.replace(tzinfo=timezone.utc)

    is_registration_open = (
        event.status == "PUBLISHED" and
        not is_full and
        (deadline is None or now <= deadline) and
        (now < end_time)
    )

    organizer = AuthorBrief(
        id=event.organizer.id,
        email=event.organizer.email,
        role=event.organizer.role,
        full_name=event.organizer.profile.full_name if event.organizer.profile else event.organizer.email,
        department=event.organizer.profile.department if event.organizer.profile else None,
        course=event.organizer.profile.course if event.organizer.profile else None,
        student_id=event.organizer.profile.student_id if event.organizer.profile else None,
        avatar_url=event.organizer.profile.avatar_url if event.organizer.profile else None,
    )

    comm_brief = None
    if event.community:
        comm_brief = CommunityBrief(
            id=event.community.id,
            name=event.community.name,
            slug=event.community.slug,
            icon_url=event.community.icon_url,
            is_private=event.community.is_private
        )

    return EventResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        category=event.category,
        venue=event.venue,
        start_time=event.start_time,
        end_time=event.end_time,
        registration_deadline=event.registration_deadline,
        max_capacity=event.max_capacity,
        current_registrations=event.current_registrations,
        remaining_capacity=remaining,
        is_full=is_full,
        is_registration_open=is_registration_open,
        banner_url=event.banner_url,
        community_id=event.community_id,
        organizer=organizer,
        community=comm_brief,
        status=event.status,
        is_registered=is_registered,
        created_at=event.created_at
    )

@router.get("", response_model=EventListResponse)
@router.get("/", response_model=EventListResponse, include_in_schema=False)
def list_events(
    category: Optional[str] = None,
    upcoming_only: bool = True,
    registered_only: bool = False,
    community_id: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Event).filter(Event.status != "CANCELLED")

    now = datetime.now(timezone.utc)
    if upcoming_only:
        query = query.filter(Event.end_time >= now)

    if category and category != "All":
        query = query.filter(Event.category == category)

    if community_id:
        query = query.filter(Event.community_id == community_id)

    if search:
        query = query.filter(Event.title.ilike(f"%{search}%") | Event.description.ilike(f"%{search}%"))

    if registered_only:
        query = query.join(EventRegistration, EventRegistration.event_id == Event.id).filter(
            EventRegistration.user_id == current_user.id,
            EventRegistration.status == "CONFIRMED"
        )

    total = query.count()
    events = query.order_by(asc(Event.start_time)).offset(offset).limit(limit).all()

    items = [build_event_response(e, current_user.id, db) for e in events]
    return EventListResponse(items=items, total=total)

@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Only faculty or admin can create campus events (or community leaders)
    if current_user.role not in [UserRole.FACULTY, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty members or administrators can organize and publish campus events."
        )

    if event_in.end_time <= event_in.start_time:
        raise HTTPException(status_code=400, detail="Event end time must be after the start time.")

    event = Event(
        title=event_in.title,
        description=event_in.description,
        category=event_in.category,
        venue=event_in.venue,
        start_time=event_in.start_time,
        end_time=event_in.end_time,
        registration_deadline=event_in.registration_deadline,
        max_capacity=event_in.max_capacity,
        current_registrations=0,
        banner_url=event_in.banner_url,
        community_id=event_in.community_id,
        organizer_id=current_user.id,
        status="PUBLISHED"
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return build_event_response(event, current_user.id, db)

@router.get("/{id}", response_model=EventResponse)
def get_event(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    event = db.query(Event).filter(Event.id == id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    return build_event_response(event, current_user.id, db)

@router.put("/{id}", response_model=EventResponse)
def update_event(
    id: str,
    event_in: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    event = db.query(Event).filter(Event.id == id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    if event.organizer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to edit this event.")

    update_data = event_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)
    return build_event_response(event, current_user.id, db)

@router.post("/{id}/register", response_model=EventResponse)
def register_for_event(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Atomically lock event row to prevent race conditions & overbooking
    event = db.query(Event).filter(Event.id == id).with_for_update().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    if event.status != "PUBLISHED":
        raise HTTPException(status_code=400, detail="This event is no longer active.")

    # Check deadline
    now = datetime.now(timezone.utc)
    if event.registration_deadline:
        deadline = event.registration_deadline if event.registration_deadline.tzinfo else event.registration_deadline.replace(tzinfo=timezone.utc)
        if now > deadline:
            raise HTTPException(status_code=400, detail="Registration deadline has passed.")

    # Check if already registered
    existing_reg = db.query(EventRegistration).filter(
        EventRegistration.event_id == event.id,
        EventRegistration.user_id == current_user.id
    ).first()

    if existing_reg:
        if existing_reg.status == "CONFIRMED":
            raise HTTPException(status_code=400, detail="You are already registered for this event.")
        else:
            # Re-confirm previous cancelled registration
            if event.current_registrations >= event.max_capacity:
                raise HTTPException(status_code=400, detail="Event capacity is full. Cannot register.")
            existing_reg.status = "CONFIRMED"
            existing_reg.registered_at = now
            event.current_registrations += 1
            db.commit()
            db.refresh(event)
            return build_event_response(event, current_user.id, db)

    # Check capacity
    if event.current_registrations >= event.max_capacity:
        raise HTTPException(status_code=400, detail="Event capacity is full. Cannot register.")

    # Create new registration
    new_reg = EventRegistration(
        event_id=event.id,
        user_id=current_user.id,
        status="CONFIRMED",
        registered_at=now
    )
    db.add(new_reg)
    event.current_registrations += 1
    db.commit()
    db.refresh(event)
    return build_event_response(event, current_user.id, db)

@router.delete("/{id}/register", response_model=EventResponse)
def cancel_event_registration(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    event = db.query(Event).filter(Event.id == id).with_for_update().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    existing_reg = db.query(EventRegistration).filter(
        EventRegistration.event_id == event.id,
        EventRegistration.user_id == current_user.id,
        EventRegistration.status == "CONFIRMED"
    ).first()

    if not existing_reg:
        raise HTTPException(status_code=400, detail="You do not have an active registration for this event.")

    existing_reg.status = "CANCELLED"
    event.current_registrations = max(0, event.current_registrations - 1)
    db.commit()
    db.refresh(event)
    return build_event_response(event, current_user.id, db)

@router.get("/{id}/attendees", response_model=List[EventAttendeeResponse])
def get_event_attendees(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    event = db.query(Event).filter(Event.id == id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    regs = db.query(EventRegistration).filter(
        EventRegistration.event_id == event.id,
        EventRegistration.status == "CONFIRMED"
    ).all()

    attendees = []
    for reg in regs:
        u = reg.user
        author = AuthorBrief(
            id=u.id,
            email=u.email,
            role=u.role,
            full_name=u.profile.full_name if u.profile else u.email,
            department=u.profile.department if u.profile else None,
            course=u.profile.course if u.profile else None,
            student_id=u.profile.student_id if u.profile else None,
            avatar_url=u.profile.avatar_url if u.profile else None,
        )
        attendees.append(EventAttendeeResponse(
            user=author,
            status=reg.status,
            registered_at=reg.registered_at
        ))

    return attendees
