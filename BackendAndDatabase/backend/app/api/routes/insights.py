"""Reports & Insights — "when a patient has X, they usually also have / get Y".

Simple association rules over one date range:
  match_rate(X → Y) = visits with both X and Y / visits with X
X is a tagged complaint (visit_complaints); Y is another complaint or a
medicine actually dispensed (visit_medicines). Only complaints that appear in
at least MIN_SUPPORT visits are considered, so one-off coincidences don't show.
"""
from collections import Counter, defaultdict
from datetime import date, timedelta, timezone
from itertools import permutations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_admin
from app.core.timeutil import CLINIC_TZ, clinic_day_range_utc
from app.db.session import get_db
from app.models.user import LoginAttempt, User
from app.models.inventory import Medicine
from app.models.lookups import Complaint
from app.models.visit import Visit, VisitComplaint, VisitMedicine
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
    # Plain (visit_id, name) rows instead of full Visit objects: a year of
    # visits is ~9,000 rows, and loading each visit with its patient, nurse
    # and lists took seconds.
    in_range = [Visit.deleted_at.is_(None)]
    start, end = clinic_day_range_utc(date_from, date_to)
    if start:
        in_range.append(Visit.started_at >= start)
    if end:
        in_range.append(Visit.started_at < end)

    complaints: dict[int, set[str]] = defaultdict(set)
    for visit_id, name in db.execute(
        select(VisitComplaint.visit_id, Complaint.complaint_name)
        .join(Complaint, Complaint.complaint_id == VisitComplaint.complaint_id)
        .join(Visit, Visit.visit_id == VisitComplaint.visit_id)
        .where(*in_range)
    ):
        complaints[visit_id].add(name)
    medicines: dict[int, set[str]] = defaultdict(set)
    for visit_id, name in db.execute(
        select(VisitMedicine.visit_id, Medicine.medicine_name)
        .join(Medicine, Medicine.medicine_id == VisitMedicine.medicine_id)
        .join(Visit, Visit.visit_id == VisitMedicine.visit_id)
        .where(*in_range)
    ):
        medicines[visit_id].add(f"{name} given")

    trigger_count: Counter[str] = Counter()
    pair_count: Counter[tuple[str, str]] = Counter()
    for visit_id, tags in complaints.items():
        given = medicines.get(visit_id, set())
        trigger_count.update(tags)
        pair_count.update(permutations(tags, 2))
        pair_count.update((c, m) for c in tags for m in given)

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
