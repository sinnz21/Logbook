from app.schemas.common import APIModel


class PatientTypeOut(APIModel):
    patient_type_id: int
    type_name: str


class DispositionOut(APIModel):
    disposition_id: int
    disposition_name: str


class ComplaintOut(APIModel):
    complaint_id: int
    complaint_name: str


class SpecialCaseTypeOut(APIModel):
    special_case_type_id: int
    case_name: str


class ItemCategoryOut(APIModel):
    category_id: int
    category_name: str
    applies_to: str


class LookupsOut(APIModel):
    """Every dropdown's reference data in one request — the frontend loads it once."""
    patient_types: list[PatientTypeOut]
    dispositions: list[DispositionOut]
    complaints: list[ComplaintOut]
    special_case_types: list[SpecialCaseTypeOut]
    item_categories: list[ItemCategoryOut]
