"""Request dependencies: current user, role guards."""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User

oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2), db: Session = Depends(get_db)
) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")

    user = db.get(User, int(payload["sub"]))
    if user is None or user.deleted_at is not None or user.status != "active":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account is not active")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")
    return user


def require_nurse(user: User = Depends(get_current_user)) -> User:
    """Nurse-only areas. Admin is deliberately NOT allowed through — Admin has
    no clinical screens in this system."""
    if user.role != "nurse":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Nurse access required")
    return user
