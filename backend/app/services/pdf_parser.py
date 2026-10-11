"""
backend/app/services/pdf_parser.py
==================================
Secure, in-memory PDF text extraction using PyMuPDF (fitz).

Security & Architectural Principles:
1. In-Memory Processing: The PDF stream is never written to disk or database.
   It lives only in RAM for the lifetime of the request, preventing persistent file leaks.
2. Magic Byte Verification: Validates that the file starts with b"%PDF-" to prevent
   spoofed extensions (e.g. an executable renamed to resume.pdf).
3. Size Limit Enforcement: Hard limit (default 5MB) prevents resource exhaustion / denial of service.
4. Safe Text Extraction: PyMuPDF passively parses font glyphs and text blocks;
   it does NOT execute any embedded JavaScript, actions, or macros.
"""

from typing import Tuple
import pymupdf  # Modern PyMuPDF import


# 5 MB maximum file size limit
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5,242,880 bytes
PDF_MAGIC_BYTES = b"%PDF"


class PDFProcessingError(Exception):
    """Custom exception raised when PDF validation or parsing fails."""
    pass


def extract_text_from_pdf_bytes(file_bytes: bytes, filename: str = "uploaded_file.pdf") -> Tuple[str, int]:
    """
    Safely extracts text and page count from raw PDF bytes in memory.

    Parameters:
    ----------
    file_bytes : bytes
        The raw byte content of the uploaded PDF file.
    filename : str
        The original name of the file (used for descriptive error messages).

    Returns:
    -------
    Tuple[str, int]
        (sanitized_extracted_text, page_count)

    Raises:
    ------
    PDFProcessingError
        If the file violates size limits, is corrupted, empty, or not a valid PDF.
    """
    # 1. Check for empty payload
    if not file_bytes or len(file_bytes) == 0:
        raise PDFProcessingError(f"The uploaded file '{filename}' is completely empty (0 bytes).")

    # 2. Check maximum size limit (5MB)
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        max_mb = MAX_FILE_SIZE_BYTES // (1024 * 1024)
        raise PDFProcessingError(
            f"The file '{filename}' ({len(file_bytes)} bytes) exceeds the maximum allowed size of {max_mb}MB."
        )

    # 3. Check for PDF Magic Bytes (%PDF)
    if not file_bytes.startswith(PDF_MAGIC_BYTES):
        raise PDFProcessingError(
            f"Security validation failed: '{filename}' does not have a valid PDF header (%PDF). "
            f"Ensure you are uploading a genuine PDF document."
        )

    # 4. In-memory PyMuPDF document loading
    try:
        # pymupdf.open(stream=..., filetype="pdf") opens directly from RAM without touching disk
        doc = pymupdf.open(stream=file_bytes, filetype="pdf")
    except Exception as exc:
        raise PDFProcessingError(f"Could not read PDF structure in '{filename}'. The file may be corrupted: {exc}")

    try:
        page_count = len(doc)
        if page_count == 0:
            raise PDFProcessingError(f"The PDF '{filename}' contains 0 pages.")

        if doc.is_encrypted:
            raise PDFProcessingError(
                f"The PDF '{filename}' is password-protected or encrypted. Please upload an unprotected PDF."
            )

        extracted_pages = []
        for page_index in range(page_count):
            page = doc.load_page(page_index)
            # "text" flag extracts plain readable text with standard spacing
            page_text = page.get_text("text")
            if page_text:
                extracted_pages.append(page_text.strip())

        full_text = "\n\n".join(extracted_pages).strip()

        # Check if the PDF has any extractable text (e.g. not a scanned image with no OCR)
        if not full_text:
            raise PDFProcessingError(
                f"No readable text could be extracted from '{filename}'. "
                f"The document may be an image-only scan without an embedded text layer."
            )

        return full_text, page_count

    finally:
        # Always close document handle to free memory immediately
        doc.close()
