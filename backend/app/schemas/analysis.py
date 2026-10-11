"""
backend/app/schemas/analysis.py
===============================
Pydantic Data Models (Schemas) for CareerPilot AI.

Why do we need schemas?
In FastAPI and modern software engineering, schemas define the exact "contract"
for data coming into and going out of your API. They provide:
1. Automatic validation (e.g., rejecting invalid types)
2. Automatic serialization to JSON
3. Automatic interactive API documentation (Swagger UI at /docs)
"""

from typing import List
from pydantic import BaseModel, Field


class SkillMatchResult(BaseModel):
    """
    Detailed breakdown of the rule-based skill matching.
    """
    matched_skills: List[str] = Field(
        ...,
        description="Skills present in both the resume and the job description."
    )
    missing_skills: List[str] = Field(
        ...,
        description="Skills required by the job description that were not detected in the resume."
    )
    resume_skills: List[str] = Field(
        ...,
        description="All recognized technical skills found in the candidate resume."
    )
    job_description_skills: List[str] = Field(
        ...,
        description="All recognized technical skills required by the job description."
    )
    match_percentage: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="The explainable match score calculated as (matched / total_jd_skills) * 100."
    )
    methodology: str = Field(
        default="Rule-based keyword and token pattern matching",
        description="Identifies the analytical method used (honest, transparent AI/ML engineering)."
    )
    explanation: str = Field(
        ...,
        description="Human-readable breakdown explaining how the match percentage was derived."
    )


class AnalysisResponse(BaseModel):
    """
    The top-level response payload returned to the frontend upon analyzing a resume.
    """
    success: bool = True
    filename: str = Field(..., description="Original name of the uploaded PDF file.")
    file_size_bytes: int = Field(..., description="Size of the uploaded PDF in bytes.")
    page_count: int = Field(..., description="Number of pages detected in the PDF.")
    extracted_text_preview: str = Field(
        ...,
        description="First 300 characters of the extracted text for quick verification."
    )
    extracted_text: str = Field(
        ...,
        description="Full sanitized text extracted from the PDF."
    )
    analysis: SkillMatchResult


class HealthResponse(BaseModel):
    """
    System status response for health check endpoint (/api/health).
    """
    status: str = "healthy"
    service: str = "CareerPilot AI Backend"
    version: str = "1.0.0"
