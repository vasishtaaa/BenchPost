from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.core.database import Base, engine
from app.core.init_db import init_db

# Create DB tables & seed standard accounts
Base.metadata.create_all(bind=engine)
init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CampusLoop API: Role-Based University Student Community & Collaboration Platform",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

# Set CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Welcome to CampusLoop API",
        "docs": f"{settings.API_V1_STR}/docs",
        "status": "online"
    }
