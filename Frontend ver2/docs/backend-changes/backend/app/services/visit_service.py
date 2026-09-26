"""Saving a visit is ONE transaction.

Insert the visit, tag its complaints, record medicines and supplies, decrement
both stock tables, write the ledger rows. All of it commits, or none of it does.

The failure this prevents: a visit saved with medicine recorded but stock never
decremented, or stock decremented for a visit that was never saved.

Why commit()/rollback() and not `with db.begin():` — the session FastAPI hands
the route is the same one get_current_user already read the User row with
(Depends(get_db) is cached per request), so SQLAlchemy has already auto-begun
a transaction and a second begin() raises "A transaction is already begun on
this Session". Everything below still runs inside that one transaction.
"""
from datetime import datetime, timezone

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.models.visit import Visit, VisitComplaint, VisitMedicine, VisitSupply
from app.schemas.visit import VisitCreate, VisitUpdate
from app.services import stock_service


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def create_visit(db: Session, payload: VisitCreate, user_id: int) -> Visit:
    try:
        patient = db.get(Patient, payload.patient_id)
        if patient is None or patient.deleted_at is not None:
            raise ValueError(f"Patient {payload.patient_id} not found")

        visit = Visit(
            patient_id=payload.patient_id,
            attending_user_id=payload.attending_user_id or user_id,
            chief_complaint=payload.chief_complaint,
            management=payload.management,
            treatment_notes=payload.treatment_notes,
            blood_pressure=payload.blood_pressure,
            temperature=payload.temperature,
            pulse_rate=payload.pulse_rate,
            started_at=_utcnow(),
            status="in_care",
            created_by=user_id,
        )
        db.add(visit)
        db.flush()                        # need visit_id for the ledger rows

        for cid in dict.fromkeys(payload.complaint_ids):   # de-dupe, keep order
            db.add(VisitComplaint(
                visit_id=visit.visit_id,
                complaint_id=cid,
                is_primary=(cid == payload.primary_complaint_id),
            ))

        for m in payload.medicines:
            db.add(VisitMedicine(
                visit_id=visit.visit_id,
                medicine_id=m.medicine_id,
                quantity_given=m.quantity_given,
                dosage=m.dosage,
                instructions=m.instructions,
                given_by=user_id,
            ))
            stock_service.release_medicine(
                db, m.medicine_id, m.quantity_given, visit.visit_id, user_id
            )

        for s in payload.supplies:
            db.add(VisitSupply(
                visit_id=visit.visit_id,
                supply_id=s.supply_id,
                quantity_used=s.quantity_used,
                remarks=s.remarks,
                given_by=user_id,
            ))
            stock_service.release_supply(
                db, s.supply_id, s.quantity_used, visit.visit_id, user_id
            )

        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(visit)
    return visit


def update_visit(db: Session, visit_id: int, payload: VisitUpdate, user_id: int) -> Visit:
    """Correct the clinical notes of a visit. Dispensed medicines/supplies are
    deliberately not editable here — the stock ledger is append-only."""
    try:
        visit = db.get(Visit, visit_id)
        if visit is None or visit.deleted_at is not None:
            raise LookupError(f"Visit {visit_id} not found")

        data = payload.model_dump(exclude_unset=True)
        complaint_ids = data.pop("complaint_ids", None)
        primary_id = data.pop("primary_complaint_id", None)
        for field, value in data.items():
            setattr(visit, field, value)

        if complaint_ids is not None:
            db.execute(delete(VisitComplaint).where(VisitComplaint.visit_id == visit_id))
            for cid in dict.fromkeys(complaint_ids):
                db.add(VisitComplaint(visit_id=visit_id, complaint_id=cid, is_primary=(cid == primary_id)))

        visit.updated_by = user_id
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.expire(visit)
    db.refresh(visit)
    return visit


def sign_out(db: Session, visit_id: int, disposition_id: int,
             notes: str | None, user_id: int) -> Visit:
    """Stamps ended_at and closes the visit."""
    try:
        visit = db.get(Visit, visit_id)
        if visit is None or visit.deleted_at is not None:
            raise ValueError(f"Visit {visit_id} not found")
        if visit.status == "completed":
            raise ValueError("Visit is already signed out")

        visit.ended_at = _utcnow()
        visit.disposition_id = disposition_id
        visit.status = "completed"
        visit.updated_by = user_id
        if notes:
            visit.treatment_notes = notes
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(visit)
    return visit
