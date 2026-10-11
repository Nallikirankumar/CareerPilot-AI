"""
backend/app/api/applications.py
===============================
CRUD endpoints for job application pipeline management with strict ownership validation.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.application import JobApplication
from app.schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/applications", tags=["Job Applications"])


@router.get("", response_model=List[ApplicationResponse])
def get_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[ApplicationResponse]:
    """Lists all job applications belonging to the authenticated user."""
    apps = (
        db.query(JobApplication)
        .filter(JobApplication.user_id == current_user.id)
        .order_by(JobApplication.created_at.desc())
        .all()
    )
    return [ApplicationResponse.model_validate(a) for a in apps]


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    app_in: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ApplicationResponse:
    """Creates a new job application record for the authenticated user."""
    new_app = JobApplication(
        user_id=current_user.id,
        company=app_in.company.strip(),
        role=app_in.role.strip(),
        status=app_in.status.strip() if app_in.status else "Applied",
        applied_date=app_in.applied_date,
        follow_up_date=app_in.follow_up_date,
        notes=app_in.notes.strip() if app_in.notes else None
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return ApplicationResponse.model_validate(new_app)


@router.patch("/{app_id}", response_model=ApplicationResponse)
def update_application(
    app_id: int,
    app_in: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ApplicationResponse:
    """Updates an existing application record, strictly enforcing ownership."""
    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    if app.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to modify this application."
        )

    if app_in.company is not None:
        app.company = app_in.company.strip()
    if app_in.role is not None:
        app.role = app_in.role.strip()
    if app_in.status is not None:
        app.status = app_in.status.strip()
    if app_in.applied_date is not None:
        app.applied_date = app_in.applied_date
    if app_in.follow_up_date is not None:
        app.follow_up_date = app_in.follow_up_date
    if app_in.notes is not None:
        app.notes = app_in.notes.strip()

    db.commit()
    db.refresh(app)
    return ApplicationResponse.model_validate(app)


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    app_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes an application record, strictly enforcing ownership."""
    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    if app.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to delete this application."
        )

    db.delete(app)
    db.commit()
    return None
