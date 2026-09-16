"""Import every model here so Alembic autogenerate and SQLAlchemy's mapper
registry see all 22 tables."""
from app.db.base import Base
from app.models.lookups import (
    Complaint, Disposition, ItemCategory, PatientType, SpecialCaseType,
)
from app.models.user import ActivityLog, LoginAttempt, SystemSetting, User
from app.models.patient import Patient, PatientSpecialCase
from app.models.visit import Visit, VisitComplaint, VisitMedicine, VisitSupply
from app.models.inventory import (
    InventoryTransaction, Medicine, MedicineStock, StockRequest,
    StockRequestItem, Supply, SupplyStock,
)

__all__ = [
    "Base",
    "PatientType", "Complaint", "Disposition", "SpecialCaseType", "ItemCategory",
    "User", "LoginAttempt", "ActivityLog", "SystemSetting",
    "Patient", "PatientSpecialCase",
    "Visit", "VisitComplaint", "VisitMedicine", "VisitSupply",
    "Medicine", "Supply", "MedicineStock", "SupplyStock",
    "StockRequest", "StockRequestItem", "InventoryTransaction",
]
