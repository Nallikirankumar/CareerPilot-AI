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

from fastapi import FastAPI, File, Form, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.schemas.analysis import AnalysisResponse, HealthResponse
from app.services.pdf_parser import (
    extract_text_from_pdf_bytes,
    PDFProcessingError,
    MAX_FILE_SIZE_BYTES
)
from app.services.matcher import match_skills

app = FastAPI(
    title="CareerPilot AI - Resume Analyzer API",
    description=(
        "Backend engine for CareerPilot AI. "
        "Provides safe in-memory PDF text extraction via PyMuPDF and transparent "
        "rule-based technical skill matching."
    ),
    version="1.0.0"
)

# CORS Configuration
# Allows requests from Vite's local dev server (default port 5173)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    job_description: str = Form(..., description="Target job description text")
) -> AnalysisResponse:
    """
    Analyzes an uploaded PDF resume against a target job description.

    Validation steps:
    1. Validates that job description text is provided and non-empty.
    2. Validates that the uploaded file has a .pdf extension.
    3. Reads file bytes into memory and checks size limit (5MB).
    4. Parses text safely using PyMuPDF in RAM (no disk persistence).
    5. Extracts skills and calculates match percentage using rule-based comparison.
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

    return AnalysisResponse(
        success=True,
        filename=filename,
        file_size_bytes=len(file_bytes),
        page_count=page_count,
        extracted_text_preview=preview,
        extracted_text=extracted_text,
        analysis=match_result
    )
