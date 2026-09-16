from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.models.user import LoginAttempt, SystemSetting, User
from app.schemas.auth import LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


def _setting(db: Session, name: str, default):
    row = db.execute(
        select(SystemSetting).where(SystemSetting.setting_name == name)
    ).scalar_one_or_none()
    return row.typed() if row else default


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    limit = _setting(db, "failed_login_limit", 5)
    window = _setting(db, "lockout_minutes", 15)
    since = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=window)

    recent_failures = db.execute(
        select(func.count())
        .select_from(LoginAttempt)
        .where(
            LoginAttempt.username == body.username,
            LoginAttempt.successful.is_(False),
            LoginAttempt.attempted_at >= since,
        )
    ).scalar_one()

    if recent_failures >= limit:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Account locked. Try again in {window} minutes.",
        )

    user = db.execute(
        select(User).where(User.username == body.username)
    ).scalar_one_or_none()

    ok = bool(
        user
        and user.deleted_at is None
        and user.status == "active"
        and verify_password(body.password, user.password_hash)
    )

    db.add(LoginAttempt(
        username=body.username,
        user_id=user.user_id if user else None,
        ip_address=request.client.host if request.client else None,
        successful=ok,
    ))
    db.commit()

    if not ok:
        # deliberately vague — do not reveal whether the username exists
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid username or password")

    user.last_login_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()

    return TokenResponse(
        access_token=create_access_token(user.user_id, user.role),
        user_id=user.user_id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
    )
