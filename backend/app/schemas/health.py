from pydantic import BaseModel
from typing import Optional

class HealthCheck(BaseModel):
    status: str
    environment: str
    version: str
    database: str
