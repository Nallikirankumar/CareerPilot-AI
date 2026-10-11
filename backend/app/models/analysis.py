"""
backend/app/models/analysis.py
==============================
SQLAlchemy ORM model for persistent resume analyses.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base


class SavedAnalysis(Base):
    __tablename__ = "saved_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    filename = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    page_count = Column(Integer, nullable=False)
    match_percentage = Column(Float, nullable=False)
    matched_skills_json = Column(Text, nullable=False)
    missing_skills_json = Column(Text, nullable=False)
    categorized_skills_json = Column(Text, nullable=True)
    evidence_snippets_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    owner = relationship("User", back_populates="analyses")
