from datetime import date, datetime

from app.schemas.common import APIModel


class SpecialCaseOut(APIModel):
    patient_special_case_id: int
    case_name: str
    notes: str | None = None
    flagged_at: datetime
    active: bool


class PatientBase(APIModel):
    patient_number: str | None = None
    first_name: str
    middle_name: str | None = None
    last_name: str
    sex: str | None = None
    date_of_birth: date | None = None
    civil_status: str | None = None
    contact_number: str | None = None
    patient_type_id: int | None = None
    department: str | None = None
    program: str | None = None
    year_level: str | None = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(APIModel):
    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None
    sex: str | None = None
    date_of_birth: date | None = None
    civil_status: str | None = None
    contact_number: str | None = None
    department: str | None = None
    program: str | None = None
    year_level: str | None = None


class PatientOut(PatientBase):
    patient_id: int
    full_name: str
    age: int | None = None          # derived on the model, never stored
    patient_type_name: str | None = None
    last_visit_at: datetime | None = None
    visit_count: int = 0
    special_cases: list[SpecialCaseOut] = []
