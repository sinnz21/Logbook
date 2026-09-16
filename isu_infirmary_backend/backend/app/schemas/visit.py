from datetime import datetime
from decimal import Decimal

from pydantic import Field

from app.schemas.common import APIModel


class MedicineGiven(APIModel):
    medicine_id: int
    quantity_given: Decimal = Field(gt=0)
    dosage: str | None = None
    instructions: str | None = None


class SupplyUsed(APIModel):
    supply_id: int
    quantity_used: Decimal = Field(gt=0)
    remarks: str | None = None


class VisitCreate(APIModel):
    patient_id: int
    chief_complaint: str
    complaint_ids: list[int] = []        # structured tags for Insights
    primary_complaint_id: int | None = None
    management: str | None = None
    treatment_notes: str | None = None
    blood_pressure: str | None = None
    temperature: Decimal | None = None
    pulse_rate: int | None = None
    attending_user_id: int | None = None
    medicines: list[MedicineGiven] = []
    supplies: list[SupplyUsed] = []


class VisitSignOut(APIModel):
    disposition_id: int
    treatment_notes: str | None = None


class MedicineGivenOut(MedicineGiven):
    medicine_name: str
    unit: str


class SupplyUsedOut(SupplyUsed):
    supply_name: str
    unit: str


class VisitOut(APIModel):
    visit_id: int
    patient_id: int
    patient_name: str
    chief_complaint: str
    complaints: list[str] = []
    management: str | None = None
    treatment_notes: str | None = None
    blood_pressure: str | None = None
    temperature: Decimal | None = None
    pulse_rate: int | None = None
    started_at: datetime
    ended_at: datetime | None = None
    duration_minutes: int | None = None
    status: str
    disposition_name: str | None = None
    attending_name: str | None = None
    medicines: list[MedicineGivenOut] = []
    supplies: list[SupplyUsedOut] = []
