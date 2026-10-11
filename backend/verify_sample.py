"""
Verification script for CareerPilot AI.
Loads the sample resume PDF and executes the full analysis pipeline against a sample Job Description.
"""

import os
from fastapi.testclient import TestClient
from app.main import app

def run_verification():
    sample_path = os.path.join("samples", "sample_resume.pdf")
    if not os.path.exists(sample_path):
        print(f"Error: {sample_path} not found.")
        return

    with open(sample_path, "rb") as f:
        pdf_bytes = f.read()

    job_description = """
    We are seeking a Full-Stack & AI Engineer.
    Required Skills:
    - Strong Python, FastAPI, and React development.
    - Experience with Docker, Git, and PostgreSQL.
    - Hands-on machine learning skills with Scikit-learn and Deep Learning.
    - Familiarity with Kubernetes, AWS, and Redis.
    """

    client = TestClient(app)
    response = client.post(
        "/api/analyze",
        files={"file": ("sample_resume.pdf", pdf_bytes, "application/pdf")},
        data={"job_description": job_description}
    )

    print(f"Status Code: {response.status_code}")
    data = response.json()
    print("\n--- ANALYSIS REPORT ---")
    print(f"Filename: {data['filename']}")
    print(f"File Size: {data['file_size_bytes']} bytes")
    print(f"Pages: {data['page_count']}")
    analysis = data['analysis']
    print(f"Match Percentage: {analysis['match_percentage']}%")
    print(f"Methodology: {analysis['methodology']}")
    print(f"Explanation: {analysis['explanation']}")
    print(f"Matched Skills ({len(analysis['matched_skills'])}): {analysis['matched_skills']}")
    print(f"Missing Skills ({len(analysis['missing_skills'])}): {analysis['missing_skills']}")
    print(f"Resume Total Skills ({len(analysis['resume_skills'])}): {analysis['resume_skills']}")

if __name__ == "__main__":
    run_verification()
