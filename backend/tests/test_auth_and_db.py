"""
backend/tests/test_auth_and_db.py
=================================
Automated tests covering:
1. User registration & secure password hashing.
2. JWT token generation & login validation.
3. Protected endpoints & 401 unauthorized rejection.
4. Job application CRUD.
5. Cross-user access prevention (IDOR security checks).
6. Persistent analysis saving for authenticated users.
"""

import uuid
from fastapi.testclient import TestClient
import pymupdf
from app.main import app
from app.db.session import SessionLocal, init_db
from app.models.user import User

client = TestClient(app)


def setup_module(module):
    """Ensure database tables are initialized before tests run."""
    init_db()


def create_synthetic_pdf(text_content: str) -> bytes:
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 50), text_content)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_user_registration_and_login():
    """Verify user registration hashes password and returns a valid JWT token."""
    email = f"alice_{uuid.uuid4().hex[:8]}@careerpilot.ai"
    password = "SuperSecurePassword123!"

    # 1. Register
    reg_response = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "full_name": "Alice Developer", "target_role": "Backend Engineer"}
    )
    assert reg_response.status_code == 201
    data = reg_response.json()
    assert "access_token" in data
    assert data["user"]["email"] == email

    # 2. Verify password is NOT stored in plaintext
    db = SessionLocal()
    db_user = db.query(User).filter(User.email == email).first()
    db.close()
    assert db_user is not None
    assert db_user.hashed_password != password
    assert db_user.hashed_password.startswith("$2")

    # 3. Duplicate registration is rejected
    dup_response = client.post(
        "/api/auth/register",
        json={"email": email, "password": password}
    )
    assert dup_response.status_code == 400
    assert "already exists" in dup_response.json()["detail"]

    # 4. Successful Login
    login_response = client.post(
        "/api/auth/login",
        json={"email": email, "password": password}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    assert token is not None

    # 5. Invalid Password Login Rejected
    bad_login = client.post(
        "/api/auth/login",
        json={"email": email, "password": "WrongPassword999"}
    )
    assert bad_login.status_code == 401


def test_protected_profile_endpoint():
    """Verify /api/auth/me requires authentication and returns the user's profile."""
    # 1. Unauthenticated request rejected
    unauth_res = client.get("/api/auth/me")
    assert unauth_res.status_code == 401

    # 2. Register & authenticate Bob
    email = f"bob_{uuid.uuid4().hex[:8]}@careerpilot.ai"
    reg_res = client.post(
        "/api/auth/register",
        json={"email": email, "password": "PasswordBob123!", "full_name": "Bob"}
    )
    token = reg_res.json()["access_token"]

    # 3. Authenticated request succeeds
    auth_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert auth_res.status_code == 200
    assert auth_res.json()["email"] == email


def test_cross_user_isolation_application_crud():
    """Verify that User B cannot edit or delete User A's job applications (IDOR prevention)."""
    # 1. Register User A
    user_a_email = f"alice_apps_{uuid.uuid4().hex[:8]}@careerpilot.ai"
    res_a = client.post(
        "/api/auth/register",
        json={"email": user_a_email, "password": "PasswordAlice123"}
    )
    token_a = res_a.json()["access_token"]

    # 2. User A creates an application
    create_res = client.post(
        "/api/applications",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "company": "Amazon",
            "role": "SDE I",
            "status": "Applied",
            "notes": "Applied via referral"
        }
    )
    assert create_res.status_code == 201
    app_id = create_res.json()["id"]

    # 3. Register User B
    user_b_email = f"mallory_{uuid.uuid4().hex[:8]}@careerpilot.ai"
    res_b = client.post(
        "/api/auth/register",
        json={"email": user_b_email, "password": "PasswordMallory123"}
    )
    token_b = res_b.json()["access_token"]

    # 4. User B attempts to modify User A's application -> 403 FORBIDDEN
    hack_patch = client.patch(
        f"/api/applications/{app_id}",
        headers={"Authorization": f"Bearer {token_b}"},
        json={"status": "Offer"}
    )
    assert hack_patch.status_code == 403
    assert "Forbidden" in hack_patch.json()["detail"]

    # 5. User B attempts to delete User A's application -> 403 FORBIDDEN
    hack_del = client.delete(
        f"/api/applications/{app_id}",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert hack_del.status_code == 403

    # 6. User A legitimately updates application -> 200 OK
    legit_patch = client.patch(
        f"/api/applications/{app_id}",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"status": "Interview"}
    )
    assert legit_patch.status_code == 200
    assert legit_patch.json()["status"] == "Interview"

    # 7. User A legitimately deletes application -> 204 No Content
    legit_del = client.delete(
        f"/api/applications/{app_id}",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert legit_del.status_code == 204


def test_authenticated_resume_analysis_persists():
    """Verify that analyzing a resume while authenticated automatically persists the record."""
    # 1. Register candidate Charlie
    email = f"charlie_{uuid.uuid4().hex[:8]}@careerpilot.ai"
    reg = client.post(
        "/api/auth/register",
        json={"email": email, "password": "PasswordCharlie123"}
    )
    token = reg.json()["access_token"]

    # 2. Analyze resume with Charlie's token
    pdf_bytes = create_synthetic_pdf("Charlie is skilled in Python, FastAPI, and Docker.")
    files = {"file": ("charlie_resume.pdf", pdf_bytes, "application/pdf")}
    data = {"job_description": "We need Python and Docker developers."}

    analyze_res = client.post(
        "/api/analyze",
        headers={"Authorization": f"Bearer {token}"},
        files=files,
        data=data
    )
    assert analyze_res.status_code == 200
    assert analyze_res.json()["analysis"]["match_percentage"] == 100.0

    # 3. Retrieve saved analyses
    saved_res = client.get("/api/analyses", headers={"Authorization": f"Bearer {token}"})
    assert saved_res.status_code == 200
    analyses_list = saved_res.json()
    assert len(analyses_list) >= 1
    assert analyses_list[0]["filename"] == "charlie_resume.pdf"
    assert analyses_list[0]["match_percentage"] == 100.0
