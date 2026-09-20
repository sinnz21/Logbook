"""Admin-only account management. Passwords are hashed here and never returned."""
import re

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.core.security import hash_password
from app.db.session import get_db
from app.models.user import SystemSetting, User
from app.schemas.common import Page
from app.schemas.user import UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


def _check_password(db: Session, password: str) -> None:
    row = db.execute(
        select(SystemSetting).where(SystemSetting.setting_name == "password_symbol_required")
    ).scalar_one_or_none()
    symbol_required = row is None or str(row.setting_value).lower() in ("1", "true")
    if symbol_required and not re.search(r"[^A-Za-z0-9]", password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Password needs at least 1 symbol")


def _commit_or_conflict(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Username or email is already in use")


@router.get("", response_model=Page[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=200),
):
    stmt = select(User).where(User.deleted_at.is_(None)).order_by(User.role, User.last_name, User.first_name)
    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    rows = db.execute(stmt.offset((page - 1) * per_page).limit(per_page)).scalars().all()
    return Page(items=[UserOut.model_validate(u) for u in rows], total=total, page=page, per_page=per_page)


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(body: UserCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    _check_password(db, body.password)
    u = User(
        first_name=body.first_name, middle_name=body.middle_name, last_name=body.last_name,
        username=body.username, email=body.email, role=body.role, status=body.status,
        password_hash=hash_password(body.password),
    )
    db.add(u)
    _commit_or_conflict(db)
    db.refresh(u)
    return UserOut.model_validate(u)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, body: UserUpdate, db: Session = Depends(get_db), me: User = Depends(require_admin)):
    u = db.get(User, user_id)
    if u is None or u.deleted_at is not None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    data = body.model_dump(exclude_unset=True)
    if u.user_id == me.user_id and (data.get("role", u.role) != u.role or data.get("status", u.status) != u.status):
        # otherwise the last admin can lock everyone out
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You can't change your own role or status")

    password = data.pop("password", None)
    if password:
        _check_password(db, password)
        u.password_hash = hash_password(password)
    for field, value in data.items():
        if field in ("first_name", "last_name") and not value:
            continue
        setattr(u, field, value)
    _commit_or_conflict(db)
    db.refresh(u)
    return UserOut.model_validate(u)
