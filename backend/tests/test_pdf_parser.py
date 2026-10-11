"""
backend/tests/test_pdf_parser.py
================================
Unit tests for safe in-memory PDF extraction and validation.
"""

import pytest
import pymupdf
from app.services.pdf_parser import (
    extract_text_from_pdf_bytes,
    PDFProcessingError,
    MAX_FILE_SIZE_BYTES
)


def create_synthetic_pdf(text_content: str) -> bytes:
    """Helper function to generate a valid PDF in memory for testing without touching disk."""
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 50), text_content)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_extract_text_valid_pdf():
    """Verify that text is correctly extracted from a valid in-memory PDF."""
    sample_text = "Software Engineer with expertise in Python, FastAPI, and Docker."
    pdf_bytes = create_synthetic_pdf(sample_text)

    extracted_text, page_count = extract_text_from_pdf_bytes(pdf_bytes, "sample.pdf")

    assert page_count == 1
    assert "Python" in extracted_text
    assert "FastAPI" in extracted_text
    assert "Docker" in extracted_text


def test_empty_bytes_raises_error():
    """Verify that an empty byte stream is rejected with a clear error."""
    with pytest.raises(PDFProcessingError) as exc_info:
        extract_text_from_pdf_bytes(b"", "empty.pdf")
    assert "completely empty" in str(exc_info.value)


def test_invalid_header_raises_error():
    """Verify that non-PDF content (invalid magic bytes) is blocked."""
    invalid_bytes = b"NOT_A_PDF_FILE_HEADER"
    with pytest.raises(PDFProcessingError) as exc_info:
        extract_text_from_pdf_bytes(invalid_bytes, "fake.pdf")
    assert "Security validation failed" in str(exc_info.value)
    assert "%PDF" in str(exc_info.value)


def test_oversized_file_raises_error():
    """Verify that files exceeding the maximum size limit are rejected."""
    # Create fake bytes exceeding MAX_FILE_SIZE_BYTES with %PDF- header
    oversized_bytes = b"%PDF-1.4" + (b"A" * (MAX_FILE_SIZE_BYTES + 100))
    with pytest.raises(PDFProcessingError) as exc_info:
        extract_text_from_pdf_bytes(oversized_bytes, "huge.pdf")
    assert "exceeds the maximum allowed size" in str(exc_info.value)
