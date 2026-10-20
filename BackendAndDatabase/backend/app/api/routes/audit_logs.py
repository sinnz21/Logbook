"""GET /api/audit-logs — the admin Audit Log screen.

One list, newest first, built from two tables:
  * login_attempts -> action "login" / "login_failed", entity "session"
  * activity_log   -> action "create" / "update" / "delete" / "backup" / "restore"
                      (every successful change, written by app/core/audit.py)

`total` respects every filter, because the screen's KPI tiles ask for
per_page=1 and read only the total.
"""
from datetime import date, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import String, case, cast, func, literal, null, or_, select, union_all
from sqlalchemy.orm import Session

from app.core.audit import ACTION_CODES
from app.core.deps import require_admin
from app.core.timeutil import clinic_day_range_utc
from app.db.session import get_db
from app.models.patient import Patient
from app.models.user import ActivityLog, LoginAttempt, User
from app.models.visit import Visit
from app.schemas.common import APIModel

router = APIRouter(prefix="/audit-logs", tags=["audit"])


class AuditLogOut(APIModel):
    log_id: str                  # "a12" = activity_log row 12, "s5" = login_attempts row 5
    at: datetime                 # naive UTC
    user_id: int | None = None
    username: str | None = None
    full_name: str | None = None
    role: str | None = None
    action: str
    entity: str | None = None
    entity_id: int | None = None
    details: str | None = None


class AuditLogPage(APIModel):
    items: list[AuditLogOut]
    total: int
    page: int
    per_page: int


def _union():
    """Both sources as one subquery with the same columns."""
    action_code = case(
        *[(ActivityLog.action == text, code) for text, code in ACTION_CODES.items()],
        else_=literal("update"),
    )
    activity = (
        select(
            func.concat("a", cast(ActivityLog.log_id, String)).label("log_id"),
            ActivityLog.created_at.label("at"),
            ActivityLog.user_id.label("user_id"),
            User.username.label("username"),
            action_code.label("action"),
            func.coalesce(ActivityLog.entity_type,
                          case((ActivityLog.log_type == "backup", literal("backup")))).label("entity"),
            ActivityLog.entity_id.label("entity_id"),
            case((ActivityLog.detail.is_(None), ActivityLog.action),
                 else_=func.concat(ActivityLog.action, ": ", ActivityLog.detail)).label("details"),
        )
        .select_from(ActivityLog)
        .outerjoin(User, User.user_id == ActivityLog.user_id)
    )
    sign_ins = select(
        func.concat("s", cast(LoginAttempt.attempt_id, String)).label("log_id"),
        LoginAttempt.attempted_at.label("at"),
        LoginAttempt.user_id.label("user_id"),
        LoginAttempt.username.label("username"),
        case((LoginAttempt.successful.is_(True), literal("login")), else_=literal("login_failed")).label("action"),
        literal("session").label("entity"),
        null().label("entity_id"),
        case(
            (LoginAttempt.successful.is_(True), literal("Signed in")),
            (LoginAttempt.user_id.is_(None), func.concat('Unknown username "', LoginAttempt.username, '"')),
            else_=literal("Wrong password, or the account is inactive"),
        ).label("details"),
    )
    return union_all(activity, sign_ins).subquery("audit")


def _names(db: Session, items: list[AuditLogOut]) -> None:
    """Add who the record was about: "Visit recorded" -> "Visit recorded for Santos, Maria R."."""
    patient_ids = {i.entity_id for i in items if i.entity == "patient" and i.entity_id}
    visit_ids = {i.entity_id for i in items if i.entity == "visit" and i.entity_id}
    user_ids = {i.entity_id for i in items if i.entity == "user" and i.entity_id}
    who: dict[tuple[str, int], str] = {}
    if patient_ids:
        for p in db.execute(select(Patient).where(Patient.patient_id.in_(patient_ids))).unique().scalars():
            who[("patient", p.patient_id)] = p.full_name
    if visit_ids:
        for v in db.execute(select(Visit).where(Visit.visit_id.in_(visit_ids))).unique().scalars():
            if v.patient:
                who[("visit", v.visit_id)] = v.patient.full_name
    if user_ids:
        for u in db.execute(select(User).where(User.user_id.in_(user_ids))).scalars():
            who[("user", u.user_id)] = u.full_name
    for i in items:
        name = who.get((i.entity or "", i.entity_id or 0))
        if name:
            i.details = f"{i.details} for {name}"


@router.get("", response_model=AuditLogPage)
def list_audit_logs(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
    action: str | None = None,
    user_id: int | None = None,
    search: str | None = None,
    date_from: date | None = Query(None, description="Clinic day (Asia/Manila), inclusive"),
    date_to: date | None = Query(None, description="Clinic day (Asia/Manila), inclusive"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=500),
):
    a = _union()
    stmt = select(a, User).outerjoin(User, User.user_id == a.c.user_id)
    if action:
        stmt = stmt.where(a.c.action == action)
    if user_id is not None:
        stmt = stmt.where(a.c.user_id == user_id)
    start, end = clinic_day_range_utc(date_from, date_to)
    if start:
        stmt = stmt.where(a.c.at >= start)
    if end:
        stmt = stmt.where(a.c.at < end)
    if search:
        like = f"%{search.strip()}%"
        name_like = or_(Patient.first_name.ilike(like), Patient.last_name.ilike(like),
                        (Patient.last_name + ", " + Patient.first_name).ilike(like),
                        (Patient.first_name + " " + Patient.last_name).ilike(like))
        patients = select(Patient.patient_id).where(name_like)
        visits = select(Visit.visit_id).join(Patient, Patient.patient_id == Visit.patient_id).where(name_like)
        stmt = stmt.where(or_(a.c.username.ilike(like), a.c.details.ilike(like), a.c.entity.ilike(like),
                              User.first_name.ilike(like), User.last_name.ilike(like),
                              (a.c.entity == "patient") & a.c.entity_id.in_(patients),
                              (a.c.entity == "visit") & a.c.entity_id.in_(visits)))

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    rows = db.execute(
        stmt.order_by(a.c.at.desc(), a.c.log_id.desc()).offset((page - 1) * per_page).limit(per_page)
    ).all()

    items = [
        AuditLogOut(
            log_id=r.log_id, at=r.at, user_id=r.user_id,
            # no user = something the server did on its own, like the daily backup
            username=r.username if r.User or r.username else "system",
            full_name=r.User.full_name if r.User else (None if r.username else "System"),
            role=r.User.role if r.User else None,
            action=r.action, entity=r.entity, entity_id=r.entity_id, details=r.details,
        )
        for r in rows
    ]
    _names(db, items)
    return AuditLogPage(items=items, total=total, page=page, per_page=per_page)
