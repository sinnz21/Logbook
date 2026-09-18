from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_nurse
from app.db.session import get_db
from app.models.user import User
from app.models.visit import Visit
from app.schemas.common import Page
from app.schemas.visit import VisitCreate, VisitOut, VisitSignOut
from app.services import visit_service
from app.services.stock_service import InsufficientStock

router = APIRouter(prefix="/visits", tags=["visits"])


def _to_out(v: Visit) -> VisitOut:
    return VisitOut(
        visit_id=v.visit_id,
        patient_id=v.patient_id,
        patient_name=v.patient.full_name,
        chief_complaint=v.chief_complaint,
        complaints=[c.complaint.complaint_name for c in v.complaints],
        management=v.management,
        treatment_notes=v.treatment_notes,
        blood_pressure=v.blood_pressure,
        temperature=v.temperature,
        pulse_rate=v.pulse_rate,
        started_at=v.started_at,
        ended_at=v.ended_at,
        duration_minutes=v.duration_minutes,
        status=v.status,
        disposition_name=v.disposition.disposition_name if v.disposition else None,
        medicines=[], supplies=[],
    )


@router.get("", response_model=Page[VisitOut])
def list_visits(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    status_filter: str | None = Query(None, alias="status"),
    sort_by: str = Query("started_at"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
):
    stmt = select(Visit).where(Visit.deleted_at.is_(None))
    if status_filter:
        stmt = stmt.where(Visit.status == status_filter)

    sortable = {
        "started_at": Visit.started_at,
        "status": Visit.status,
        "visit_id": Visit.visit_id,
    }
    col = sortable.get(sort_by, Visit.started_at)
    stmt = stmt.order_by(col.desc() if order == "desc" else col.asc())

    total = db.execute(
        select(func.count()).select_from(stmt.subquery())
    ).scalar_one()
    rows = db.execute(
        stmt.offset((page - 1) * per_page).limit(per_page)
    ).scalars().all()

    return Page(items=[_to_out(v) for v in rows], total=total,
                page=page, per_page=per_page)


@router.post("", response_model=VisitOut, status_code=status.HTTP_201_CREATED)
def create_visit(
    body: VisitCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_nurse),
):
    try:
        visit = visit_service.create_visit(db, body, user.user_id)
    except InsufficientStock as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    return _to_out(visit)


@router.post("/{visit_id}/sign-out", response_model=VisitOut)
def sign_out(
    visit_id: int,
    body: VisitSignOut,
    db: Session = Depends(get_db),
    user: User = Depends(require_nurse),
):
    try:
        visit = visit_service.sign_out(
            db, visit_id, body.disposition_id, body.treatment_notes, user.user_id
        )
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    return _to_out(visit)
