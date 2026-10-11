"""
backend/app/models/user.py
==========================
SQLAlchemy ORM model for user accounts and credentials.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    target_role = Column(String(255), nullable=True, default="Software Engineer")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    analyses = relationship("SavedAnalysis", back_populates="owner", cascade="all, delete-orphan")
    applications = relationship("JobApplication", back_populates="owner", cascade="all, delete-orphan")
