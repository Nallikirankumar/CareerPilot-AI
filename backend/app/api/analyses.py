"""
backend/app/api/analyses.py
===========================
Endpoints for saved resume analyses with ownership validation.
"""

import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.analysis import SavedAnalysis
from app.api.deps import get_current_user

router = APIRouter(prefix="/analyses", tags=["Saved Analyses"])


@router.get("", response_model=List[Dict[str, Any]])
def get_saved_analyses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Retrieves all saved analyses for the current authenticated user."""
    records = (
        db.query(SavedAnalysis)
        .filter(SavedAnalysis.user_id == current_user.id)
        .order_by(SavedAnalysis.created_at.desc())
        .all()
    )

    results = []
    for r in records:
        results.append({
            "id": r.id,
            "filename": r.filename,
            "file_size_bytes": r.file_size_bytes,
            "page_count": r.page_count,
            "match_percentage": r.match_percentage,
            "matched_skills": json.loads(r.matched_skills_json) if r.matched_skills_json else [],
            "missing_skills": json.loads(r.missing_skills_json) if r.missing_skills_json else [],
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
    return results


@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saved_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a saved analysis, strictly enforcing user ownership."""
    record = db.query(SavedAnalysis).filter(SavedAnalysis.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")

    if record.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to delete this analysis."
        )

    db.delete(record)
    db.commit()
    return None
