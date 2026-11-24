from fastapi import APIRouter
from app.api.v1.endpoints import (
    health, 
    auth, 
    users, 
    communities, 
    discussions, 
    polls, 
    events, 
    announcements,
    notifications,
    admin,
    moderation
)

api_router = APIRouter()
api_router.include_router(health.router, prefix="", tags=["System"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users & Profiles"])
api_router.include_router(communities.router, prefix="/communities", tags=["Communities"])
api_router.include_router(discussions.router, prefix="/posts", tags=["Discussions & Posts"])
api_router.include_router(polls.router, prefix="/polls", tags=["Campus Polls"])
api_router.include_router(events.router, prefix="/events", tags=["Campus Events"])
api_router.include_router(announcements.router, prefix="/announcements", tags=["Official Announcements"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administration & Analytics"])
api_router.include_router(moderation.router, prefix="/moderation", tags=["Content Moderation"])
