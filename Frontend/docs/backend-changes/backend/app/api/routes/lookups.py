from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.lookups import Complaint, Disposition, ItemCategory, PatientType, SpecialCaseType
from app.models.user import User
from app.schemas.lookups import LookupsOut

router = APIRouter(prefix="/lookups", tags=["lookups"])


def _active(db: Session, model, order_col):
    return db.execute(select(model).where(model.active.is_(True)).order_by(order_col)).scalars().all()


@router.get("", response_model=LookupsOut)
def get_lookups(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return LookupsOut(
        patient_types=_active(db, PatientType, PatientType.patient_type_id),
        dispositions=_active(db, Disposition, Disposition.disposition_id),
        complaints=_active(db, Complaint, Complaint.complaint_name),
        special_case_types=_active(db, SpecialCaseType, SpecialCaseType.special_case_type_id),
        item_categories=_active(db, ItemCategory, ItemCategory.category_name),
    )
