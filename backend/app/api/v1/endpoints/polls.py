from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.poll import Poll, PollOption, PollVote
from app.schemas.poll import PollCreate, PollVoteRequest, PollResponse, PollOptionResponse
from app.schemas.discussion import AuthorBrief

router = APIRouter()

def build_poll_response(poll: Poll, current_user_id: str, db: Session) -> PollResponse:
    now = datetime.now(timezone.utc)
    is_expired = False
    if poll.expires_at:
        # Normalize timezone if needed
        expires_at = poll.expires_at if poll.expires_at.tzinfo else poll.expires_at.replace(tzinfo=timezone.utc)
        is_expired = now > expires_at

    # Get total votes count
    total_votes = db.query(PollVote).filter(PollVote.poll_id == poll.id).count()

    # Get user votes
    user_votes = db.query(PollVote.option_id).filter(
        PollVote.poll_id == poll.id,
        PollVote.user_id == current_user_id
    ).all()
    user_voted_option_ids = [uv[0] for uv in user_votes]

    # Build options response
    options_res = []
    for opt in poll.options:
        vote_count = db.query(PollVote).filter(PollVote.option_id == opt.id).count()
        percentage = round((vote_count / total_votes * 100), 1) if total_votes > 0 else 0.0
        options_res.append(PollOptionResponse(
            id=opt.id,
            poll_id=opt.poll_id,
            text=opt.text,
            order=opt.order,
            vote_count=vote_count,
            percentage=percentage
        ))

    author = AuthorBrief(
        id=poll.created_by.id,
        email=poll.created_by.email,
        role=poll.created_by.role,
        full_name=poll.created_by.profile.full_name if poll.created_by.profile else poll.created_by.email,
        department=poll.created_by.profile.department if poll.created_by.profile else None,
        course=poll.created_by.profile.course if poll.created_by.profile else None,
        student_id=poll.created_by.profile.student_id if poll.created_by.profile else None,
        avatar_url=poll.created_by.profile.avatar_url if poll.created_by.profile else None,
    )

    return PollResponse(
        id=poll.id,
        post_id=poll.post_id,
        community_id=poll.community_id,
        question=poll.question,
        is_multiple_choice=poll.is_multiple_choice,
        expires_at=poll.expires_at,
        is_expired=is_expired,
        total_votes=total_votes,
        created_at=poll.created_at,
        created_by=author,
        options=options_res,
        user_voted_option_ids=user_voted_option_ids
    )

@router.get("", response_model=List[PollResponse])
@router.get("/", response_model=List[PollResponse], include_in_schema=False)
def list_polls(
    community_id: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Poll)
    if community_id:
        query = query.filter(Poll.community_id == community_id)
    polls = query.order_by(Poll.created_at.desc()).limit(limit).all()
    return [build_poll_response(p, current_user.id, db) for p in polls]

@router.post("", response_model=PollResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=PollResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_poll(
    poll_in: PollCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if len(poll_in.options) < 2:
        raise HTTPException(status_code=400, detail="A poll must have at least 2 options.")

    poll = Poll(
        question=poll_in.question,
        is_multiple_choice=poll_in.is_multiple_choice,
        expires_at=poll_in.expires_at,
        post_id=poll_in.post_id,
        community_id=poll_in.community_id,
        created_by_id=current_user.id
    )
    db.add(poll)
    db.flush()

    for idx, opt_text in enumerate(poll_in.options):
        opt = PollOption(
            poll_id=poll.id,
            text=opt_text.strip(),
            order=idx
        )
        db.add(opt)

    db.commit()
    db.refresh(poll)
    return build_poll_response(poll, current_user.id, db)

@router.get("/{id}", response_model=PollResponse)
def get_poll(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    poll = db.query(Poll).filter(Poll.id == id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found.")
    return build_poll_response(poll, current_user.id, db)

@router.get("/by-post/{post_id}", response_model=Optional[PollResponse])
def get_poll_by_post(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    poll = db.query(Poll).filter(Poll.post_id == post_id).first()
    if not poll:
        return None
    return build_poll_response(poll, current_user.id, db)

@router.post("/{id}/vote", response_model=PollResponse)
def vote_poll(
    id: str,
    vote_in: PollVoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    poll = db.query(Poll).filter(Poll.id == id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found.")

    # Check expiration
    now = datetime.now(timezone.utc)
    if poll.expires_at:
        expires_at = poll.expires_at if poll.expires_at.tzinfo else poll.expires_at.replace(tzinfo=timezone.utc)
        if now > expires_at:
            raise HTTPException(status_code=400, detail="This poll has closed and no longer accepts votes.")

    # Check multiple choice rule
    if not poll.is_multiple_choice and len(vote_in.option_ids) > 1:
        raise HTTPException(status_code=400, detail="This is a single-choice poll; select only one option.")

    # Validate option IDs belong to this poll
    valid_option_ids = {opt.id for opt in poll.options}
    for opt_id in vote_in.option_ids:
        if opt_id not in valid_option_ids:
            raise HTTPException(status_code=400, detail=f"Invalid option ID: {opt_id}")

    # Remove existing votes from this user on this poll
    db.query(PollVote).filter(
        PollVote.poll_id == poll.id,
        PollVote.user_id == current_user.id
    ).delete(synchronize_session=False)

    # Cast new vote(s)
    for opt_id in vote_in.option_ids:
        new_vote = PollVote(
            poll_id=poll.id,
            option_id=opt_id,
            user_id=current_user.id
        )
        db.add(new_vote)

    db.commit()
    db.refresh(poll)
    return build_poll_response(poll, current_user.id, db)
