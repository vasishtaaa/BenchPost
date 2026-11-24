from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, desc
from app.core.database import get_db
from app.models.discussion import Post, Comment, Reaction, Bookmark, ReactionType
from app.models.community import Community, CommunityMember, CommunityRole, MembershipStatus
from app.models.user import User, UserRole
from app.schemas.discussion import (
    PostCreate,
    PostUpdate,
    PostResponse,
    PostListResponse,
    CommentCreate,
    CommentResponse,
    ReactionToggleInput,
    ReactionToggleResponse,
    BookmarkToggleResponse,
    ReactionCounts,
    AuthorBrief,
    CommunityBrief
)
from app.api.deps import get_current_active_user, get_optional_current_user

router = APIRouter()

def format_author_brief(user: Optional[User]) -> Optional[AuthorBrief]:
    if not user:
        return None
    profile = user.profile
    return AuthorBrief(
        id=user.id,
        email=user.email,
        role=user.role,
        full_name=profile.full_name if profile else "Campus User",
        department=profile.department if profile else None,
        course=profile.course if profile else None,
        student_id=profile.student_id if profile else None,
        avatar_url=profile.avatar_url if profile else None
    )

def format_community_brief(community: Optional[Community]) -> Optional[CommunityBrief]:
    if not community:
        return None
    return CommunityBrief(
        id=community.id,
        name=community.name,
        slug=community.slug,
        icon_url=community.icon_url,
        is_private=community.is_private
    )

def get_post_reaction_counts(post_id: str, db: Session) -> ReactionCounts:
    rows = db.query(Reaction.reaction_type, func.count(Reaction.id)).filter(
        Reaction.post_id == post_id
    ).group_by(Reaction.reaction_type).all()

    counts = {"like": 0, "helpful": 0, "celebrate": 0, "interesting": 0, "total": 0}
    for r_type, count in rows:
        key = r_type.value.lower()
        if key in counts:
            counts[key] = count
            counts["total"] += count

    return ReactionCounts(**counts)

def format_post_response(post: Post, current_user: Optional[User], db: Session) -> PostResponse:
    # Comments count
    comments_count = db.query(func.count(Comment.id)).filter(
        Comment.post_id == post.id,
        Comment.is_deleted == False
    ).scalar() or 0

    # Reaction counts
    reactions = get_post_reaction_counts(post.id, db)

    # Current user reaction & bookmark
    user_reaction = None
    is_bookmarked = False

    if current_user:
        user_rec = db.query(Reaction).filter(
            Reaction.post_id == post.id,
            Reaction.user_id == current_user.id
        ).first()
        if user_rec:
            user_reaction = user_rec.reaction_type

        bm = db.query(Bookmark).filter(
            Bookmark.post_id == post.id,
            Bookmark.user_id == current_user.id
        ).first()
        is_bookmarked = (bm is not None)

    return PostResponse(
        id=post.id,
        community_id=post.community_id,
        author_id=post.author_id,
        title=post.title,
        content=post.content,
        category=post.category,
        is_pinned=post.is_pinned,
        views_count=post.views_count,
        created_at=post.created_at,
        updated_at=post.updated_at,
        author=format_author_brief(post.author),
        community=format_community_brief(post.community),
        comments_count=comments_count,
        reactions=reactions,
        user_reaction=user_reaction,
        is_bookmarked=is_bookmarked
    )

# ----------------- POSTS -----------------

@router.get("", response_model=PostListResponse)
def list_posts(
    search: Optional[str] = None,
    category: Optional[str] = None,
    community_id: Optional[str] = None,
    community_slug: Optional[str] = None,
    author_id: Optional[str] = None,
    sort: str = Query("newest", pattern="^(newest|popular|most_discussed)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve posts with search, category filtering, community filtering, and sorting."""
    query = db.query(Post)

    if community_slug:
        comm = db.query(Community).filter(Community.slug == community_slug).first()
        if comm:
            query = query.filter(Post.community_id == comm.id)
    elif community_id:
        query = query.filter(Post.community_id == community_id)

    if author_id:
        query = query.filter(Post.author_id == author_id)

    if category and category != "All":
        query = query.filter(Post.category == category)

    if search:
        query = query.filter(
            or_(
                Post.title.ilike(f"%{search}%"),
                Post.content.ilike(f"%{search}%")
            )
        )

    total = query.count()

    # Sorting
    if sort == "popular":
        # Order by reactions count + views
        query = query.outerjoin(Reaction).group_by(Post.id).order_by(
            desc(Post.is_pinned),
            desc(func.count(Reaction.id)),
            desc(Post.views_count),
            desc(Post.created_at)
        )
    elif sort == "most_discussed":
        query = query.outerjoin(Comment).group_by(Post.id).order_by(
            desc(Post.is_pinned),
            desc(func.count(Comment.id)),
            desc(Post.created_at)
        )
    else:  # newest
        query = query.order_by(desc(Post.is_pinned), desc(Post.created_at))

    posts = query.offset(skip).limit(limit).all()
    items = [format_post_response(p, current_user, db) for p in posts]

    return PostListResponse(total=total, items=items)

@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    post_in: PostCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new discussion post in a community."""
    community = db.query(Community).filter(
        or_(Community.id == post_in.community_id, Community.slug == post_in.community_id)
    ).first()

    if not community:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found")

    # Verify membership unless Platform Admin
    if current_user.role != UserRole.ADMIN:
        membership = db.query(CommunityMember).filter(
            CommunityMember.community_id == community.id,
            CommunityMember.user_id == current_user.id,
            CommunityMember.status == MembershipStatus.ACTIVE
        ).first()

        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be an active member of this community to create discussions."
            )

    db_post = Post(
        community_id=community.id,
        author_id=current_user.id,
        title=post_in.title,
        content=post_in.content,
        category=post_in.category or "General"
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)

    return format_post_response(db_post, current_user, db)

@router.get("/{post_id}", response_model=PostResponse)
def get_post(
    post_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full discussion post by ID and increment view count."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discussion post not found")

    # Increment view counter
    post.views_count += 1
    db.commit()
    db.refresh(post)

    return format_post_response(post, current_user, db)

@router.put("/{post_id}", response_model=PostResponse)
def update_post(
    post_id: str,
    post_in: PostUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a discussion post. Permitted for author or community/platform moderators."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    # Permission check
    is_author = (post.author_id == current_user.id)
    is_platform_admin = (current_user.role == UserRole.ADMIN)
    
    comm_mem = db.query(CommunityMember).filter(
        CommunityMember.community_id == post.community_id,
        CommunityMember.user_id == current_user.id
    ).first()
    is_comm_leader = comm_mem and comm_mem.role in [CommunityRole.ADMIN, CommunityRole.MODERATOR]

    if not (is_author or is_platform_admin or is_comm_leader):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied.")

    update_data = post_in.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(post, k, v)

    db.commit()
    db.refresh(post)
    return format_post_response(post, current_user, db)

@router.delete("/{post_id}")
def delete_post(
    post_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a discussion post."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    is_author = (post.author_id == current_user.id)
    is_platform_admin = (current_user.role == UserRole.ADMIN)

    comm_mem = db.query(CommunityMember).filter(
        CommunityMember.community_id == post.community_id,
        CommunityMember.user_id == current_user.id
    ).first()
    is_comm_leader = comm_mem and comm_mem.role in [CommunityRole.ADMIN, CommunityRole.MODERATOR]

    if not (is_author or is_platform_admin or is_comm_leader):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied.")

    db.delete(post)
    db.commit()
    return {"message": "Discussion post deleted successfully."}

@router.post("/{post_id}/pin")
def toggle_pin_post(
    post_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Toggle pinned status of a post. (Moderators and Admins only)."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    is_platform_admin = (current_user.role == UserRole.ADMIN)
    comm_mem = db.query(CommunityMember).filter(
        CommunityMember.community_id == post.community_id,
        CommunityMember.user_id == current_user.id
    ).first()
    is_comm_leader = comm_mem and comm_mem.role in [CommunityRole.ADMIN, CommunityRole.MODERATOR]

    if not (is_platform_admin or is_comm_leader):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only community moderators or admins can pin discussions.")

    post.is_pinned = not post.is_pinned
    db.commit()
    return {"message": f"Post {'pinned' if post.is_pinned else 'unpinned'} successfully.", "is_pinned": post.is_pinned}

# ----------------- COMMENTS -----------------

def format_comment_tree(comment: Comment, all_comments: List[Comment]) -> CommentResponse:
    """Recursively formats a comment and its nested replies."""
    replies = [c for c in all_comments if c.parent_id == comment.id]
    formatted_replies = [format_comment_tree(r, all_comments) for r in replies]

    content = "[This comment has been deleted]" if comment.is_deleted else comment.content

    return CommentResponse(
        id=comment.id,
        post_id=comment.post_id,
        author_id=comment.author_id,
        parent_id=comment.parent_id,
        content=content,
        is_deleted=comment.is_deleted,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        author=format_author_brief(comment.author),
        replies=formatted_replies
    )

@router.get("/{post_id}/comments", response_model=List[CommentResponse])
def get_post_comments(post_id: str, db: Session = Depends(get_db)):
    """Retrieve full threaded comment tree for a post."""
    comments = db.query(Comment).filter(
        Comment.post_id == post_id
    ).order_by(Comment.created_at.asc()).all()

    top_level = [c for c in comments if c.parent_id is None]
    return [format_comment_tree(c, comments) for c in top_level]

@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(
    post_id: str,
    comment_in: CommentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add a top-level comment or threaded reply to a post."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    # If replying, verify parent comment belongs to the same post
    if comment_in.parent_id:
        parent = db.query(Comment).filter(Comment.id == comment_in.parent_id).first()
        if not parent or parent.post_id != post_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid parent comment")

    db_comment = Comment(
        post_id=post.id,
        author_id=current_user.id,
        parent_id=comment_in.parent_id,
        content=comment_in.content
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)

    return CommentResponse(
        id=db_comment.id,
        post_id=db_comment.post_id,
        author_id=db_comment.author_id,
        parent_id=db_comment.parent_id,
        content=db_comment.content,
        is_deleted=db_comment.is_deleted,
        created_at=db_comment.created_at,
        updated_at=db_comment.updated_at,
        author=format_author_brief(current_user),
        replies=[]
    )

@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Soft delete a comment to preserve thread continuity."""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    is_author = (comment.author_id == current_user.id)
    is_platform_admin = (current_user.role == UserRole.ADMIN)

    if not (is_author or is_platform_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied.")

    comment.is_deleted = True
    comment.content = "[This comment has been deleted]"
    db.commit()
    return {"message": "Comment deleted."}

# ----------------- REACTIONS -----------------

@router.post("/{post_id}/reactions", response_model=ReactionToggleResponse)
def toggle_reaction(
    post_id: str,
    reaction_in: ReactionToggleInput,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Toggle or update reaction on a post.
    - If already reacted with same type -> remove (toggle off).
    - If reacted with different type -> update to new type.
    - If not reacted -> create reaction.
    Duplicate reactions are prevented at both code and database constraint level.
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    existing_reaction = db.query(Reaction).filter(
        Reaction.post_id == post.id,
        Reaction.user_id == current_user.id
    ).first()

    current_reaction = None
    if existing_reaction:
        if existing_reaction.reaction_type == reaction_in.reaction_type:
            # Toggle off
            db.delete(existing_reaction)
            msg = "Reaction removed."
            current_reaction = None
        else:
            # Change reaction type
            existing_reaction.reaction_type = reaction_in.reaction_type
            msg = f"Reaction updated to {reaction_in.reaction_type.value}."
            current_reaction = reaction_in.reaction_type
    else:
        # Create new reaction
        new_rec = Reaction(
            post_id=post.id,
            user_id=current_user.id,
            reaction_type=reaction_in.reaction_type
        )
        db.add(new_rec)
        msg = f"Reacted with {reaction_in.reaction_type.value}."
        current_reaction = reaction_in.reaction_type

    db.commit()
    reaction_counts = get_post_reaction_counts(post.id, db)

    return ReactionToggleResponse(
        message=msg,
        current_reaction=current_reaction,
        reactions=reaction_counts
    )

# ----------------- BOOKMARKS -----------------

@router.post("/{post_id}/bookmark", response_model=BookmarkToggleResponse)
def toggle_bookmark(
    post_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Toggle bookmark state on a discussion post."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    existing_bm = db.query(Bookmark).filter(
        Bookmark.post_id == post.id,
        Bookmark.user_id == current_user.id
    ).first()

    if existing_bm:
        db.delete(existing_bm)
        is_bookmarked = False
        msg = "Bookmark removed."
    else:
        new_bm = Bookmark(post_id=post.id, user_id=current_user.id)
        db.add(new_bm)
        is_bookmarked = True
        msg = "Post bookmarked."

    db.commit()
    return BookmarkToggleResponse(message=msg, is_bookmarked=is_bookmarked)

@router.get("/bookmarks/saved", response_model=PostListResponse)
def get_user_bookmarks(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve all posts bookmarked by the authenticated user."""
    query = db.query(Post).join(Bookmark, Post.id == Bookmark.post_id).filter(
        Bookmark.user_id == current_user.id
    ).order_by(desc(Bookmark.created_at))

    total = query.count()
    posts = query.offset(skip).limit(limit).all()
    items = [format_post_response(p, current_user, db) for p in posts]

    return PostListResponse(total=total, items=items)
