"""
backend/app/db/session.py
=========================
SQLAlchemy 2.0 database engine, session factory, and dependency injection provider.

Design:
1. Supports SQLite for instant local zero-config execution and isolated unit tests.
2. Supports PostgreSQL in production without code modification.
3. FastAPI dependency get_db ensures each HTTP request receives an isolated database transaction,
   guaranteeing proper cleanup and commit/rollback.
"""

import os
from typing import Generator

# Ensure pure-Python fallback for SQLAlchemy in environments with Windows Application Control policies
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

# Engine setup: SQLite requires check_same_thread=False for multithreaded FastAPI workers
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields an independent database session per request
    and guarantees it is closed when the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes tables in the target database."""
    # Import all models before create_all to ensure they are registered on Base.metadata
    from app.models import user, analysis, application  # noqa: F401
    Base.metadata.create_all(bind=engine)
