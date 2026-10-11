"""
backend/app/api/deps.py
=======================
FastAPI dependencies for database access and JWT user authentication.
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import decode_access_token
from app.models.user import User

security = HTTPBearer(auto_error=False)


def get_current_user_optional(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Returns the authenticated User if a valid Bearer token is provided;
    returns None if the request is unauthenticated (guest mode).
    """
    if not auth or not auth.credentials:
        return None

    user_id = decode_access_token(auth.credentials)
    if not user_id:
        return None

    try:
        user = db.query(User).filter(User.id == int(user_id)).first()
        return user
    except Exception:
        return None


def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional)
) -> User:
    """
    Guarantees the user is authenticated. Raises 401 Unauthorized if not.
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user
