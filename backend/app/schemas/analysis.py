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

from typing import List, Dict, Optional
from pydantic import BaseModel, Field


class CategoryBreakdown(BaseModel):
    """Breakdown of skills within a specific taxonomy category."""
    matched: List[str] = Field(default_factory=list)
    missing: List[str] = Field(default_factory=list)
    resume: List[str] = Field(default_factory=list)
    job_description: List[str] = Field(default_factory=list)


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
    required_skills: List[str] = Field(
        default_factory=list,
        description="Skills identified specifically as mandatory/required in the job description."
    )
    preferred_skills: List[str] = Field(
        default_factory=list,
        description="Skills identified as preferred or bonus qualifications in the job description."
    )
    categorized_skills: Dict[str, CategoryBreakdown] = Field(
        default_factory=dict,
        description="Skills grouped by domain category (e.g. Programming Languages, AI/ML, Cloud)."
    )
    evidence_snippets: Dict[str, List[str]] = Field(
        default_factory=dict,
        description="Resume text snippets/bullet points where each detected skill was found."
    )
    match_percentage: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="The explainable match score calculated as (matched / total_jd_skills) * 100 or weighted."
    )
    methodology: str = Field(
        default="Rule-based keyword and token pattern matching",
        description="Identifies the analytical method used (honest, transparent AI/ML engineering)."
    )
    explanation: str = Field(
        ...,
        description="Human-readable breakdown explaining how the match percentage was derived."
    )
    engine_mode: str = Field(
        default="deterministic",
        description="Indicates analytical engine mode ('deterministic' or 'semantic-hybrid')."
    )
    semantic_similarity: Optional[float] = Field(
        default=None,
        description="Cosine semantic textual alignment percentage (0-100%)."
    )
    semantic_model: Optional[str] = Field(
        default=None,
        description="Name of the semantic vector engine used."
    )
    shared_context_terms: List[str] = Field(
        default_factory=list,
        description="Top shared contextual terms identified between resume and job description."
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
