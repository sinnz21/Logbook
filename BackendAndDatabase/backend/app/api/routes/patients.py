from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_nurse
from app.db.session import get_db
from app.models.lookups import PatientType, SpecialCaseType
from app.models.patient import Patient, PatientSpecialCase
from app.models.user import User
from app.models.visit import Visit
from app.schemas.common import Page
from app.schemas.patient import (
    PatientCreate, PatientOut, PatientUpdate, SpecialCaseCreate, SpecialCaseListOut,
    SpecialCaseOut, SpecialCaseUpdate,
)

router = APIRouter(prefix="/patients", tags=["patients"])


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _case_out(c: PatientSpecialCase) -> SpecialCaseOut:
    return SpecialCaseOut(
        patient_special_case_id=c.patient_special_case_id,
        special_case_type_id=c.special_case_type_id,
        case_name=c.case_type.case_name,
        notes=c.notes,
        flagged_at=c.flagged_at,
        active=c.active,
    )


def _to_out(db: Session, p: Patient) -> PatientOut:
    count, last = db.execute(
        select(func.count(Visit.visit_id), func.max(Visit.started_at))
        .where(Visit.patient_id == p.patient_id, Visit.deleted_at.is_(None))
    ).one()
    return PatientOut(
        patient_id=p.patient_id,
        patient_number=p.patient_number,
        first_name=p.first_name,
        middle_name=p.middle_name,
        last_name=p.last_name,
        sex=p.sex,
        date_of_birth=p.date_of_birth,
        civil_status=p.civil_status,
        contact_number=p.contact_number,
        patient_type_id=p.patient_type_id,
        department=p.department,
        program=p.program,
        year_level=p.year_level,
        full_name=p.full_name,
        age=p.age,
        patient_type_name=p.patient_type.type_name if p.patient_type else None,
        last_visit_at=last,
        visit_count=count,
        special_cases=[_case_out(c) for c in p.special_cases],
    )


def _get_patient(db: Session, patient_id: int) -> Patient:
    p = db.get(Patient, patient_id)
    if p is None or p.deleted_at is not None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient not found")
    return p


def _check_type(db: Session, patient_type_id: int | None) -> None:
    if patient_type_id is not None and db.get(PatientType, patient_type_id) is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown patient type {patient_type_id}")


def _commit_or_conflict(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "That ID number is already registered to another patient")


# NOTE: declared before "/{patient_id}" so "special-cases" isn't parsed as an id.
@router.get("/special-cases", response_model=list[SpecialCaseListOut])
def list_special_cases(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    active: bool | None = True,
):
    stmt = (
        select(PatientSpecialCase)
        .join(PatientSpecialCase.patient)
        .where(Patient.deleted_at.is_(None))
        .order_by(PatientSpecialCase.flagged_at.desc())
    )
    if active is not None:
        stmt = stmt.where(PatientSpecialCase.active.is_(active))
    rows = db.execute(stmt).scalars().all()
    return [
        SpecialCaseListOut(
            **_case_out(c).model_dump(),
            patient_id=c.patient_id,
            patient_name=c.patient.full_name,
            patient_number=c.patient.patient_number,
            patient_type_name=c.patient.patient_type.type_name if c.patient.patient_type else None,
        )
        for c in rows
    ]


@router.get("", response_model=Page[PatientOut])
def list_patients(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    search: str | None = None,
    patient_type_id: int | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=200),
):
    stmt = select(Patient).where(Patient.deleted_at.is_(None))
    if search:
        like = f"%{search.strip()}%"
        stmt = stmt.where(or_(
            Patient.first_name.ilike(like),
            Patient.last_name.ilike(like),
            Patient.patient_number.ilike(like),
            (Patient.last_name + ", " + Patient.first_name).ilike(like),
            (Patient.first_name + " " + Patient.last_name).ilike(like),
        ))
    if patient_type_id is not None:
        stmt = stmt.where(Patient.patient_type_id == patient_type_id)
    stmt = stmt.order_by(Patient.last_name, Patient.first_name)

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    rows = db.execute(stmt.offset((page - 1) * per_page).limit(per_page)).unique().scalars().all()
    return Page(items=[_to_out(db, p) for p in rows], total=total, page=page, per_page=per_page)


@router.post("", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def create_patient(body: PatientCreate, db: Session = Depends(get_db), _: User = Depends(require_nurse)):
    _check_type(db, body.patient_type_id)
    p = Patient(**body.model_dump())
    db.add(p)
    _commit_or_conflict(db)
    db.refresh(p)
    return _to_out(db, p)


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return _to_out(db, _get_patient(db, patient_id))


@router.patch("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: int, body: PatientUpdate, db: Session = Depends(get_db), _: User = Depends(require_nurse),
):
    p = _get_patient(db, patient_id)
    data = body.model_dump(exclude_unset=True)
    _check_type(db, data.get("patient_type_id"))
    for field, value in data.items():
        if field in ("first_name", "last_name") and not value:
            continue  # required columns — ignore an explicit null
        setattr(p, field, value)
    _commit_or_conflict(db)
    db.refresh(p)
    return _to_out(db, p)


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(patient_id: int, db: Session = Depends(get_db), _: User = Depends(require_nurse)):
    p = _get_patient(db, patient_id)
    p.deleted_at = _utcnow()
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{patient_id}/special-cases", response_model=SpecialCaseOut, status_code=status.HTTP_201_CREATED)
def flag_special_case(
    patient_id: int, body: SpecialCaseCreate, db: Session = Depends(get_db), user: User = Depends(require_nurse),
):
    p = _get_patient(db, patient_id)
    case_type = db.get(SpecialCaseType, body.special_case_type_id)
    if case_type is None or not case_type.active:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown special case type")
    if any(c.active and c.special_case_type_id == case_type.special_case_type_id for c in p.special_cases):
        raise HTTPException(status.HTTP_409_CONFLICT, f"{p.full_name} is already flagged as {case_type.case_name}")

    c = PatientSpecialCase(
        patient_id=patient_id,
        special_case_type_id=case_type.special_case_type_id,
        origin_visit_id=body.origin_visit_id,
        notes=body.notes,
        flagged_by=user.user_id,
        active=True,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return _case_out(c)


@router.patch("/{patient_id}/special-cases/{case_id}", response_model=SpecialCaseOut)
def update_special_case(
    patient_id: int, case_id: int, body: SpecialCaseUpdate,
    db: Session = Depends(get_db), _: User = Depends(require_nurse),
):
    c = db.get(PatientSpecialCase, case_id)
    if c is None or c.patient_id != patient_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Flag not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(c, field, value)
    db.commit()
    db.refresh(c)
    return _case_out(c)
