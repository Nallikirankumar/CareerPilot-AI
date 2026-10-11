"""
backend/app/main.py
===================
FastAPI Application Entry Point for CareerPilot AI.

Key Responsibilities:
1. Initialize FastAPI application with informative metadata.
2. Configure Cross-Origin Resource Sharing (CORS) so the React Vite frontend can communicate safely.
3. Expose /api/health for system verification and uptime monitoring.
4. Expose /api/analyze to process uploaded PDF resumes and compare them against job descriptions.
5. Provide consistent, structured HTTP error responses.
"""

import os
import json
from contextlib import asynccontextmanager
from typing import Optional

# Ensure pure-Python fallback for SQLAlchemy in environments with Windows Application Control policies
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import init_db, get_db
from app.api import auth, applications, analyses
from app.api.deps import get_current_user_optional
from app.models.user import User
from app.models.analysis import SavedAnalysis
from app.schemas.analysis import AnalysisResponse, HealthResponse
from app.services.pdf_parser import (
    extract_text_from_pdf_bytes,
    PDFProcessingError,
    MAX_FILE_SIZE_BYTES
)
from app.services.matcher import match_skills


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Backend engine for CareerPilot AI 2.0. "
        "Provides in-memory PDF parsing, explainable skill matching, "
        "and persistent career development data."
    ),
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Sub-Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(applications.router, prefix=settings.API_V1_STR)
app.include_router(analyses.router, prefix=settings.API_V1_STR)


@app.get("/api/health", response_model=HealthResponse, tags=["System"])
def get_health() -> HealthResponse:
    """
    Health check endpoint to verify backend operational readiness.
    """
    return HealthResponse(
        status="healthy",
        service="CareerPilot AI Backend",
        version="1.0.0"
    )


@app.post(
    "/api/analyze",
    response_model=AnalysisResponse,
    status_code=status.HTTP_200_OK,
    tags=["Resume Analysis"],
    responses={
        400: {"description": "Invalid input, empty job description, or corrupted PDF"},
        413: {"description": "Uploaded PDF exceeds maximum allowed size (5MB)"},
        500: {"description": "Unexpected internal processing error"}
    }
)
async def analyze_resume(
    file: UploadFile = File(..., description="PDF resume file to analyze"),
    job_description: str = Form(..., description="Target job description text"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
) -> AnalysisResponse:
    """
    Analyzes an uploaded PDF resume against a target job description.

    Validation steps:
    1. Validates that job description text is provided and non-empty.
    2. Validates that the uploaded file has a .pdf extension.
    3. Reads file bytes into memory and checks size limit (5MB).
    4. Parses text safely using PyMuPDF in RAM (no disk persistence of raw files).
    5. Extracts skills and calculates match percentage using rule-based comparison.
    6. If the user is authenticated, persists the analysis metadata to the database.
    """
    # 1. Validate Job Description
    clean_jd = job_description.strip() if job_description else ""
    if not clean_jd:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The job description cannot be empty. Please paste the job requirements to compare against."
        )

    # 2. Validate File Extension
    filename = file.filename or "uploaded_file.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type for '{filename}'. Only PDF documents (.pdf) are supported in Phase 1."
        )

    # 3. Read uploaded bytes in-memory
    try:
        file_bytes = await file.read()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file stream: {exc}"
        )

    # 4. Check File Size Limit
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File '{filename}' exceeds the maximum allowed size limit of 5MB."
        )

    # 5. Extract Text via PyMuPDF safely
    try:
        extracted_text, page_count = extract_text_from_pdf_bytes(file_bytes, filename=filename)
    except PDFProcessingError as p_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(p_err)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while parsing the PDF: {exc}"
        )

    # 6. Perform Rule-Based Skill Matching
    match_result = match_skills(extracted_text, clean_jd)

    preview_length = 300
    preview = (
        extracted_text[:preview_length] + "..."
        if len(extracted_text) > preview_length
        else extracted_text
    )

    # 7. Persist analysis record if the user is authenticated
    if current_user:
        try:
            saved_analysis = SavedAnalysis(
                user_id=current_user.id,
                filename=filename,
                file_size_bytes=len(file_bytes),
                page_count=page_count,
                match_percentage=match_result.match_percentage,
                matched_skills_json=json.dumps(match_result.matched_skills),
                missing_skills_json=json.dumps(match_result.missing_skills),
                categorized_skills_json=json.dumps({k: v.model_dump() for k, v in match_result.categorized_skills.items()}),
                evidence_snippets_json=json.dumps(match_result.evidence_snippets)
            )
            db.add(saved_analysis)
            db.commit()
        except Exception:
            # Failure to persist should not break the return payload
            db.rollback()

    return AnalysisResponse(
        success=True,
        filename=filename,
        file_size_bytes=len(file_bytes),
        page_count=page_count,
        extracted_text_preview=preview,
        extracted_text=extracted_text,
        analysis=match_result
    )
