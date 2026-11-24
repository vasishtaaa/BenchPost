import re
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.core.database import get_db
from app.models.community import Community, CommunityMember, CommunityRole, MembershipStatus
from app.models.user import User, UserRole
from app.schemas.community import (
    CommunityCreate, 
    CommunityUpdate, 
    CommunityResponse, 
    CommunityListResponse, 
    CommunityMemberResponse,
    MemberUserBrief
)
from app.api.deps import get_current_active_user, get_optional_current_user

router = APIRouter()

def slugify(text: str) -> str:
    """Generate a clean URL-friendly slug from text."""
    slug = re.sub(r'[^a-zA-Z0-9]+', '-', text.lower()).strip('-')
    return slug or "community"

def format_community_response(community: Community, current_user: Optional[User], db: Session) -> CommunityResponse:
    """Helper to attach member count and user-specific membership status."""
    # Count active members
    active_member_count = db.query(func.count(CommunityMember.id)).filter(
        CommunityMember.community_id == community.id,
        CommunityMember.status == MembershipStatus.ACTIVE
    ).scalar() or 0

    is_member = False
    membership_status = None
    user_role = None

    if current_user:
        membership = db.query(CommunityMember).filter(
            CommunityMember.community_id == community.id,
            CommunityMember.user_id == current_user.id
        ).first()
        if membership:
            is_member = (membership.status == MembershipStatus.ACTIVE)
            membership_status = membership.status
            user_role = membership.role

    return CommunityResponse(
        id=community.id,
        name=community.name,
        slug=community.slug,
        description=community.description,
        category=community.category,
        rules=community.rules,
        is_private=community.is_private,
        creator_id=community.creator_id,
        icon_url=community.icon_url,
        banner_url=community.banner_url,
        created_at=community.created_at,
        updated_at=community.updated_at,
        member_count=active_member_count,
        is_member=is_member,
        membership_status=membership_status,
        user_role=user_role
    )

@router.get("", response_model=CommunityListResponse)
def list_communities(
    search: Optional[str] = None,
    category: Optional[str] = None,
    my_communities: bool = False,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """List communities with optional search, category filter, and membership filter."""
    query = db.query(Community)

    if search:
        query = query.filter(
            or_(
                Community.name.ilike(f"%{search}%"),
                Community.description.ilike(f"%{search}%")
            )
        )

    if category and category != "All":
        query = query.filter(Community.category == category)

    if my_communities and current_user:
        query = query.join(CommunityMember, Community.id == CommunityMember.community_id).filter(
            CommunityMember.user_id == current_user.id,
            CommunityMember.status == MembershipStatus.ACTIVE
        )

    total = query.count()
    communities = query.order_by(Community.created_at.desc()).offset(skip).limit(limit).all()

    items = [format_community_response(c, current_user, db) for c in communities]
    return CommunityListResponse(total=total, items=items)

@router.post("", response_model=CommunityResponse, status_code=status.HTTP_201_CREATED)
def create_community(
    community_in: CommunityCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new community and designate the creator as Community Admin."""
    # Check duplicate name
    existing_name = db.query(Community).filter(Community.name.ilike(community_in.name)).first()
    if existing_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A community with this name already exists."
        )

    base_slug = slugify(community_in.name)
    slug = base_slug
    counter = 1
    while db.query(Community).filter(Community.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    icon_url = community_in.icon_url or f"https://api.dicebear.com/7.x/identicon/svg?seed={slug}"
    banner_url = community_in.banner_url or "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80"

    db_community = Community(
        name=community_in.name,
        slug=slug,
        description=community_in.description,
        category=community_in.category or "General",
        rules=community_in.rules,
        is_private=community_in.is_private,
        creator_id=current_user.id,
        icon_url=icon_url,
        banner_url=banner_url
    )
    db.add(db_community)
    db.flush()

    # Automatically add creator as ADMIN with ACTIVE status
    creator_member = CommunityMember(
        community_id=db_community.id,
        user_id=current_user.id,
        role=CommunityRole.ADMIN,
        status=MembershipStatus.ACTIVE
    )
    db.add(creator_member)
    db.commit()
    db.refresh(db_community)

    return format_community_response(db_community, current_user, db)

@router.get("/{slug_or_id}", response_model=CommunityResponse)
def get_community_details(
    slug_or_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve community details by slug or UUID."""
    community = db.query(Community).filter(
        or_(Community.slug == slug_or_id, Community.id == slug_or_id)
    ).first()

    if not community:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community not found"
        )

    return format_community_response(community, current_user, db)

@router.put("/{community_id}", response_model=CommunityResponse)
def update_community(
    community_id: str,
    community_in: CommunityUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update community details. Permitted for Community Admin/Moderator or Platform Admin."""
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found")

    # Check permission
    is_platform_admin = (current_user.role == UserRole.ADMIN)
    membership = db.query(CommunityMember).filter(
        CommunityMember.community_id == community.id,
        CommunityMember.user_id == current_user.id
    ).first()

    is_community_leader = membership and membership.role in [CommunityRole.ADMIN, CommunityRole.MODERATOR]
    if not (is_platform_admin or is_community_leader):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have moderator or administrator privileges in this community."
        )

    update_data = community_in.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != community.name:
        existing = db.query(Community).filter(Community.name.ilike(update_data["name"])).first()
        if existing and existing.id != community.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name already in use.")
        community.slug = slugify(update_data["name"])

    for field, val in update_data.items():
        setattr(community, field, val)

    db.commit()
    db.refresh(community)
    return format_community_response(community, current_user, db)

@router.post("/{community_id}/join")
def join_community(
    community_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Join a community. Public communities grant instant membership; private ones request approval."""
    community = db.query(Community).filter(
        or_(Community.id == community_id, Community.slug == community_id)
    ).first()
    if not community:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found")

    membership = db.query(CommunityMember).filter(
        CommunityMember.community_id == community.id,
        CommunityMember.user_id == current_user.id
    ).first()

    if membership:
        if membership.status == MembershipStatus.ACTIVE:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You are already a member of this community.")
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Your membership request is currently pending moderator approval.")

    new_status = MembershipStatus.PENDING if community.is_private else MembershipStatus.ACTIVE
    new_member = CommunityMember(
        community_id=community.id,
        user_id=current_user.id,
        role=CommunityRole.MEMBER,
        status=new_status
    )
    db.add(new_member)
    db.commit()

    if community.is_private:
        return {
            "message": "Membership request submitted for moderator approval.",
            "status": "PENDING"
        }
    return {
        "message": "Joined community successfully.",
        "status": "ACTIVE"
    }

@router.post("/{community_id}/leave")
def leave_community(
    community_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Leave a community."""
    community = db.query(Community).filter(
        or_(Community.id == community_id, Community.slug == community_id)
    ).first()
    if not community:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found")

    membership = db.query(CommunityMember).filter(
        CommunityMember.community_id == community.id,
        CommunityMember.user_id == current_user.id
    ).first()

    if not membership:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You are not a member of this community.")

    db.delete(membership)
    db.commit()
    return {"message": "You have left the community."}

@router.get("/{community_id}/members", response_model=List[CommunityMemberResponse])
def get_community_members(
    community_id: str,
    status_filter: Optional[MembershipStatus] = None,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve community members. Moderators can view both ACTIVE and PENDING members."""
    community = db.query(Community).filter(
        or_(Community.id == community_id, Community.slug == community_id)
    ).first()
    if not community:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found")

    query = db.query(CommunityMember).filter(CommunityMember.community_id == community.id)

    # Check if user is moderator/admin
    is_moderator = False
    if current_user:
        if current_user.role == UserRole.ADMIN:
            is_moderator = True
        else:
            mem = db.query(CommunityMember).filter(
                CommunityMember.community_id == community.id,
                CommunityMember.user_id == current_user.id
            ).first()
            if mem and mem.role in [CommunityRole.ADMIN, CommunityRole.MODERATOR]:
                is_moderator = True

    if not is_moderator:
        query = query.filter(CommunityMember.status == MembershipStatus.ACTIVE)
    elif status_filter:
        query = query.filter(CommunityMember.status == status_filter)

    members = query.order_by(CommunityMember.joined_at.desc()).all()

    results = []
    for m in members:
        user_info = None
        if m.user:
            profile = m.user.profile
            user_info = MemberUserBrief(
                id=m.user.id,
                email=m.user.email,
                role=m.user.role,
                full_name=profile.full_name if profile else "Member",
                student_id=profile.student_id if profile else None,
                department=profile.department if profile else None,
                avatar_url=profile.avatar_url if profile else None
            )

        results.append(CommunityMemberResponse(
            id=m.id,
            community_id=m.community_id,
            user_id=m.user_id,
            role=m.role,
            status=m.status,
            joined_at=m.joined_at,
            user=user_info
        ))

    return results

@router.post("/{community_id}/members/{user_id}/approve")
def approve_member(
    community_id: str,
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Approve a pending membership request. (Moderators/Admins only)."""
    community = db.query(Community).filter(
        or_(Community.id == community_id, Community.slug == community_id)
    ).first()
    if not community:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found")

    # Check current user's authority
    is_platform_admin = (current_user.role == UserRole.ADMIN)
    current_mem = db.query(CommunityMember).filter(
        CommunityMember.community_id == community.id,
        CommunityMember.user_id == current_user.id
    ).first()
    if not (is_platform_admin or (current_mem and current_mem.role in [CommunityRole.ADMIN, CommunityRole.MODERATOR])):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied.")

    target_membership = db.query(CommunityMember).filter(
        CommunityMember.community_id == community.id,
        CommunityMember.user_id == user_id
    ).first()
    if not target_membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership request not found.")

    target_membership.status = MembershipStatus.ACTIVE
    db.commit()
    return {"message": "Member request approved successfully."}

@router.delete("/{community_id}/members/{user_id}")
def remove_or_reject_member(
    community_id: str,
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Reject pending request or remove member from community. (Moderators/Admins only)."""
    community = db.query(Community).filter(
        or_(Community.id == community_id, Community.slug == community_id)
    ).first()
    if not community:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found")

    is_platform_admin = (current_user.role == UserRole.ADMIN)
    current_mem = db.query(CommunityMember).filter(
        CommunityMember.community_id == community.id,
        CommunityMember.user_id == current_user.id
    ).first()
    if not (is_platform_admin or (current_mem and current_mem.role in [CommunityRole.ADMIN, CommunityRole.MODERATOR])):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied.")

    target_membership = db.query(CommunityMember).filter(
        CommunityMember.community_id == community.id,
        CommunityMember.user_id == user_id
    ).first()
    if not target_membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found.")

    db.delete(target_membership)
    db.commit()
    return {"message": "Member removed or request rejected."}
