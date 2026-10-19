"""Reports & Insights — "when a patient has X, they usually also have / get Y".

Simple association rules over one date range:
  match_rate(X → Y) = visits with both X and Y / visits with X
X is a tagged complaint (visit_complaints); Y is another complaint or a
medicine actually dispensed (visit_medicines). Only complaints that appear in
at least MIN_SUPPORT visits are considered, so one-off coincidences don't show.
"""
from collections import Counter
from datetime import date, timedelta, timezone
from itertools import permutations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_admin
from app.core.timeutil import CLINIC_TZ, clinic_day_range_utc
from app.db.session import get_db
from app.models.user import LoginAttempt, User
from app.models.visit import Visit
from app.schemas.common import APIModel

router = APIRouter(prefix="/insights", tags=["insights"])

MIN_SUPPORT = 3        # co-occurrences needed before a pattern is reported
MIN_RATE = 0.5


class PatternOut(APIModel):
    trigger: str
    associated_with: str
    match_rate: float       # 0–1
    support: int            # visits where both occurred


@router.get("/patterns", response_model=list[PatternOut])
def patterns(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = Query(10, ge=1, le=50),
):
    stmt = select(Visit).where(Visit.deleted_at.is_(None))
    start, end = clinic_day_range_utc(date_from, date_to)
    if start:
        stmt = stmt.where(Visit.started_at >= start)
    if end:
        stmt = stmt.where(Visit.started_at < end)

    trigger_count: Counter[str] = Counter()
    pair_count: Counter[tuple[str, str]] = Counter()
    for v in db.execute(stmt).unique().scalars():
        complaints = {c.complaint.complaint_name for c in v.complaints}
        medicines = {f"{m.medicine.medicine_name} given" for m in v.medicines}
        trigger_count.update(complaints)
        pair_count.update(permutations(complaints, 2))
        pair_count.update((c, m) for c in complaints for m in medicines)

    out = []
    for (x, y), both in pair_count.items():
        rate = both / trigger_count[x]
        if both >= MIN_SUPPORT and rate >= MIN_RATE:
            out.append(PatternOut(trigger=x, associated_with=y, match_rate=round(rate, 3), support=both))
    out.sort(key=lambda p: (-p.match_rate, -p.support, p.trigger))
    return out[:limit]


# ── Sign-in activity (admin dashboard chart) ────────────────────────────────

class SignInDayOut(APIModel):
    day: date              # clinic calendar day (Asia/Manila)
    successful: int
    failed: int


@router.get("/sign-ins", response_model=list[SignInDayOut])
def sign_ins(
    date_from: date,
    date_to: date,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Sign-in attempts per clinic day, one row per day in [date_from, date_to] (max 92 days)."""
    if date_to < date_from or (date_to - date_from).days > 92:
        raise HTTPException(status_code=422, detail="Date range must be 1 to 93 days")
    start, end = clinic_day_range_utc(date_from, date_to)
    rows = db.execute(
        select(LoginAttempt.attempted_at, LoginAttempt.successful)
        .where(LoginAttempt.attempted_at >= start, LoginAttempt.attempted_at < end)
    ).all()
    days = {date_from + timedelta(days=i): [0, 0] for i in range((date_to - date_from).days + 1)}
    for at, ok in rows:
        d = at.replace(tzinfo=timezone.utc).astimezone(CLINIC_TZ).date()
        if d in days:
            days[d][0 if ok else 1] += 1
    return [SignInDayOut(day=d, successful=s, failed=f) for d, (s, f) in days.items()]
