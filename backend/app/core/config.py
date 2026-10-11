"""
backend/app/core/config.py
==========================
Centralized application settings using Pydantic Settings.

Design Principles:
1. Environment-driven configuration (12-Factor App methodology).
2. Safe local default: SQLite database for zero-config local development,
   seamlessly overridable to PostgreSQL via DATABASE_URL in .env.
3. Secure token lifecycles and configurable CORS.
"""

from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "CareerPilot AI"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"

    # JWT Authentication settings
    SECRET_KEY: str = "careerpilot-dev-secret-key-2026-portfolio-secure-jwt-token"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database configuration
    # Default: local SQLite file (zero-config, works everywhere on student laptops).
    # Production: set DATABASE_URL="postgresql://user:pass@localhost:5432/careerpilot" in .env
    DATABASE_URL: str = "sqlite:///./careerpilot.db"

    # CORS origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
