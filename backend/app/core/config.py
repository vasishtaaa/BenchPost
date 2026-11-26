from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Benchpost"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    
    # Security
    SECRET_KEY: str = "supersecret_campusloop_jwt_dev_key_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database (defaults to local SQLite for portable zero-config dev/demo)
    DATABASE_URL: str = "sqlite:///./campusloop.db"
    
    # University Email Validation
    REQUIRE_UNIVERSITY_DOMAIN: bool = False
    ALLOWED_UNIVERSITY_DOMAINS: List[str] = ["edu", "ac.in", "university.edu"]
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://vasishtaaa.github.io"
    ]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
