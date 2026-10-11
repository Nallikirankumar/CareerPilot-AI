"""
backend/tests/test_api.py
=========================
Integration tests for FastAPI endpoints (/api/health and /api/analyze).
"""

from fastapi.testclient import TestClient
import pymupdf
from app.main import app

client = TestClient(app)


def create_synthetic_pdf(text_content: str) -> bytes:
    """Creates a valid PDF byte string directly in memory."""
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 50), text_content)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_health_endpoint():
    """Verify the /api/health endpoint returns 200 and healthy status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "CareerPilot AI Backend"
    assert "version" in data


def test_analyze_endpoint_valid():
    """Verify /api/analyze with a valid PDF and job description returns complete match results."""
    pdf_bytes = create_synthetic_pdf("Experienced Python and FastAPI backend developer with Docker and PostgreSQL skills.")
    job_description = "We are hiring a backend engineer skilled in Python, FastAPI, and Kubernetes."

    files = {
        "file": ("resume.pdf", pdf_bytes, "application/pdf")
    }
    data = {
        "job_description": job_description
    }

    response = client.post("/api/analyze", files=files, data=data)
    assert response.status_code == 200
    res_data = response.json()

    assert res_data["success"] is True
    assert res_data["filename"] == "resume.pdf"
    assert res_data["page_count"] == 1
    assert "extracted_text" in res_data

    analysis = res_data["analysis"]
    assert "Python" in analysis["matched_skills"]
    assert "FastAPI" in analysis["matched_skills"]
    assert "Kubernetes" in analysis["missing_skills"]
    # 2 out of 3 matched = 66.7%
    assert analysis["match_percentage"] == 66.7
    assert "Rule-based keyword and token pattern matching" in analysis["methodology"]


def test_analyze_endpoint_empty_jd():
    """Verify that submitting an empty job description is rejected with 400 Bad Request."""
    pdf_bytes = create_synthetic_pdf("Some resume content")
    files = {
        "file": ("resume.pdf", pdf_bytes, "application/pdf")
    }
    data = {
        "job_description": "   "
    }

    response = client.post("/api/analyze", files=files, data=data)
    assert response.status_code == 400
    assert "job description cannot be empty" in response.json()["detail"]


def test_analyze_endpoint_invalid_file_type():
    """Verify that uploading a non-PDF file is rejected with 400 Bad Request."""
    files = {
        "file": ("resume.txt", b"plain text content", "text/plain")
    }
    data = {
        "job_description": "We need Python."
    }

    response = client.post("/api/analyze", files=files, data=data)
    assert response.status_code == 400
    assert "Only PDF documents (.pdf) are supported" in response.json()["detail"]


def test_analyze_endpoint_corrupted_pdf():
    """Verify that an invalid PDF payload is safely rejected with 400 Bad Request."""
    files = {
        "file": ("corrupt.pdf", b"fake binary content", "application/pdf")
    }
    data = {
        "job_description": "We need Python."
    }

    response = client.post("/api/analyze", files=files, data=data)
    assert response.status_code == 400
    assert "Security validation failed" in response.json()["detail"]
