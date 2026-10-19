"""Trash: soft-deleted patients and visits, restorable until soft_delete_days pass."""
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.db.session import get_db
from app.models.patient import Patient
from app.models.user import SystemSetting, User
from app.models.visit import Visit
from app.schemas.common import APIModel

router = APIRouter(prefix="/trash", tags=["trash"])


class TrashItemOut(APIModel):
    kind: Literal["patient", "visit"]
    id: int
    label: str
    detail: str | None = None
    deleted_at: datetime
    purge_at: datetime


def _retention_days(db: Session) -> int:
    row = db.execute(select(SystemSetting).where(SystemSetting.setting_name == "soft_delete_days")).scalar_one_or_none()
    try:
        return int(row.setting_value) if row and row.setting_value else 90
    except ValueError:
        return 90


@router.get("", response_model=list[TrashItemOut])
def list_trash(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    keep = timedelta(days=_retention_days(db))
    items: list[TrashItemOut] = []
    for p in db.execute(select(Patient).where(Patient.deleted_at.is_not(None))).scalars():
        items.append(TrashItemOut(kind="patient", id=p.patient_id, label=p.full_name,
                                  detail="Patient record", deleted_at=p.deleted_at, purge_at=p.deleted_at + keep))
    for v in db.execute(select(Visit).where(Visit.deleted_at.is_not(None))).unique().scalars():
        who = v.patient.full_name if getattr(v, "patient", None) else f"Patient #{v.patient_id}"
        items.append(TrashItemOut(kind="visit", id=v.visit_id, label=f"Visit: {who}",
                                  detail=v.chief_complaint[:120], deleted_at=v.deleted_at,
                                  purge_at=v.deleted_at + keep))
    return sorted(items, key=lambda i: i.deleted_at, reverse=True)


@router.post("/{kind}/{item_id}/restore", response_model=TrashItemOut)
def restore(kind: Literal["patient", "visit"], item_id: int,
            db: Session = Depends(get_db), _: User = Depends(require_admin)):
    model = Patient if kind == "patient" else Visit
    obj = db.get(model, item_id)
    if obj is None or obj.deleted_at is None:
        raise HTTPException(status_code=404, detail="Not in the trash")
    deleted_at = obj.deleted_at
    obj.deleted_at = None
    db.commit()
    label = obj.full_name if kind == "patient" else f"Visit #{item_id}"
    return TrashItemOut(kind=kind, id=item_id, label=label, deleted_at=deleted_at,
                        purge_at=deleted_at + timedelta(days=_retention_days(db)))
