from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_nurse
from app.core.timeutil import clinic_day_range_utc
from app.db.session import get_db
from app.models.patient import Patient
from app.models.user import User
from app.models.visit import Visit
from app.schemas.common import Page
from app.schemas.visit import (
    MedicineGivenOut, SupplyUsedOut, VisitCreate, VisitOut, VisitSignOut,
    VisitSpecialCase, VisitUpdate,
)
from app.services import visit_service
from app.services.stock_service import InsufficientStock

router = APIRouter(prefix="/visits", tags=["visits"])


def _to_out(v: Visit) -> VisitOut:
    p = v.patient
    return VisitOut(
        visit_id=v.visit_id,
        patient_id=v.patient_id,
        patient_name=p.full_name,
        patient_number=p.patient_number,
        patient_type_name=p.patient_type.type_name if p.patient_type else None,
        sex=p.sex,
        year_level=p.year_level,
        program=p.program,
        department=p.department,
        special_cases=[
            VisitSpecialCase(case_name=c.case_type.case_name, notes=c.notes)
            for c in p.special_cases if c.active
        ],
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
        created_at=v.created_at,
        updated_at=v.updated_at,
        disposition_id=v.disposition_id,
        disposition_name=v.disposition.disposition_name if v.disposition else None,
        attending_name=v.attending.full_name if v.attending else None,
        medicines=[
            MedicineGivenOut(
                medicine_id=m.medicine_id, quantity_given=m.quantity_given,
                dosage=m.dosage, instructions=m.instructions,
                medicine_name=m.medicine.medicine_name, unit=m.medicine.unit,
            )
            for m in v.medicines
        ],
        supplies=[
            SupplyUsedOut(
                supply_id=s.supply_id, quantity_used=s.quantity_used, remarks=s.remarks,
                supply_name=s.supply.supply_name, unit=s.supply.unit,
            )
            for s in v.supplies
        ],
    )


def _get_visit(db: Session, visit_id: int) -> Visit:
    v = db.get(Visit, visit_id)
    if v is None or v.deleted_at is not None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Visit not found")
    return v


@router.get("", response_model=Page[VisitOut])
def list_visits(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    status_filter: str | None = Query(None, alias="status"),
    patient_id: int | None = None,
    search: str | None = None,
    sex: str | None = None,
    year_level: str | None = None,
    program: str | None = None,
    department: str | None = None,
    date_from: date | None = Query(None, description="Clinic day (Asia/Manila), inclusive"),
    date_to: date | None = Query(None, description="Clinic day (Asia/Manila), inclusive"),
    sort_by: str = Query("started_at"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
):
    stmt = (
        select(Visit)
        .join(Visit.patient)
        .where(Visit.deleted_at.is_(None), Patient.deleted_at.is_(None))
    )
    if status_filter:
        stmt = stmt.where(Visit.status == status_filter)
    if patient_id is not None:
        stmt = stmt.where(Visit.patient_id == patient_id)
    if search:
        like = f"%{search.strip()}%"
        stmt = stmt.where(or_(
            Patient.first_name.ilike(like),
            Patient.last_name.ilike(like),
            Patient.patient_number.ilike(like),
            (Patient.last_name + ", " + Patient.first_name).ilike(like),
            (Patient.first_name + " " + Patient.last_name).ilike(like),
            Visit.chief_complaint.ilike(like),
        ))
    if sex:
        stmt = stmt.where(func.lower(Patient.sex) == sex.lower())
    if year_level:
        stmt = stmt.where(Patient.year_level == year_level)
    if program:
        stmt = stmt.where(Patient.program == program)
    if department:
        stmt = stmt.where(Patient.department == department)
    start, end = clinic_day_range_utc(date_from, date_to)
    if start:
        stmt = stmt.where(Visit.started_at >= start)
    if end:
        stmt = stmt.where(Visit.started_at < end)

    sortable = {
        "started_at": [Visit.started_at],
        "status": [Visit.status],
        "visit_id": [Visit.visit_id],
        "patient_name": [Patient.last_name, Patient.first_name],
    }
    cols = sortable.get(sort_by, sortable["started_at"])
    stmt = stmt.order_by(*[c.desc() if order == "desc" else c.asc() for c in cols], Visit.visit_id.desc())

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    rows = db.execute(stmt.offset((page - 1) * per_page).limit(per_page)).unique().scalars().all()

    return Page(items=[_to_out(v) for v in rows], total=total, page=page, per_page=per_page)


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


@router.patch("/{visit_id}", response_model=VisitOut)
def update_visit(
    visit_id: int,
    body: VisitUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_nurse),
):
    try:
        visit = visit_service.update_visit(db, visit_id, body, user.user_id)
    except LookupError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    return _to_out(visit)


@router.delete("/{visit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_visit(
    visit_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_nurse),
):
    visit = _get_visit(db, visit_id)
    visit.deleted_at = datetime.now(timezone.utc).replace(tzinfo=None)
    visit.updated_by = user.user_id
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
