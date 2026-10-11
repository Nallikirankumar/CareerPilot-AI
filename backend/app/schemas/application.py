"""
backend/app/schemas/application.py
==================================
Pydantic schemas for job application tracking.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ApplicationCreate(BaseModel):
    company: str = Field(..., min_length=1, description="Company name")
    role: str = Field(..., min_length=1, description="Target role title")
    status: str = Field(default="Applied", description="Pipeline stage (Planned, Applied, Interview, Offer, Rejected)")
    applied_date: Optional[str] = None
    follow_up_date: Optional[str] = None
    notes: Optional[str] = None


class ApplicationUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    applied_date: Optional[str] = None
    follow_up_date: Optional[str] = None
    notes: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: int
    company: str
    role: str
    status: str
    applied_date: Optional[str] = None
    follow_up_date: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

