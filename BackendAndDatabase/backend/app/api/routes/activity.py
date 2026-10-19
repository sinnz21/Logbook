"""GET /api/activity — the admin audit trail (Settings → Activity log)."""
from datetime import date, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.core.timeutil import clinic_day_range_utc
from app.db.session import get_db
from app.models.user import ActivityLog, User
from app.schemas.common import APIModel

router = APIRouter(prefix="/activity", tags=["activity"])


class ActivityOut(APIModel):
    log_id: int
    created_at: datetime
    user_name: str | None = None
    username: str | None = None
    action: str
    entity_type: str | None = None
    entity_id: int | None = None
    detail: str | None = None
    log_type: str


class ActivityPage(APIModel):
    items: list[ActivityOut]
    total: int
    page: int
    per_page: int


@router.get("", response_model=ActivityPage)
def list_activity(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
    search: str | None = None,
    log_type: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=500),
):
    stmt = select(ActivityLog, User).outerjoin(User, User.user_id == ActivityLog.user_id)
    if log_type:
        stmt = stmt.where(ActivityLog.log_type == log_type)
    start, end = clinic_day_range_utc(date_from, date_to)
    if start:
        stmt = stmt.where(ActivityLog.created_at >= start)
    if end:
        stmt = stmt.where(ActivityLog.created_at < end)
    if search:
        like = f"%{search.strip()}%"
        stmt = stmt.where(or_(ActivityLog.action.ilike(like), ActivityLog.detail.ilike(like),
                              User.username.ilike(like), User.first_name.ilike(like), User.last_name.ilike(like)))
    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    rows = db.execute(stmt.order_by(ActivityLog.created_at.desc(), ActivityLog.log_id.desc())
                      .offset((page - 1) * per_page).limit(per_page)).all()
    items = [ActivityOut(log_id=a.log_id, created_at=a.created_at,
                         user_name=u.full_name if u else None, username=u.username if u else "system",
                         action=a.action, entity_type=a.entity_type, entity_id=a.entity_id,
                         detail=a.detail, log_type=a.log_type) for a, u in rows]
    return ActivityPage(items=items, total=total, page=page, per_page=per_page)
