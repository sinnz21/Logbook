from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin


class Patient(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "patients"

    patient_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_number: Mapped[str | None] = mapped_column(String(50), unique=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    middle_name: Mapped[str | None] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    sex: Mapped[str | None] = mapped_column(String(30))
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    civil_status: Mapped[str | None] = mapped_column(String(30))
    contact_number: Mapped[str | None] = mapped_column(String(30))
    patient_type_id: Mapped[int | None] = mapped_column(
        ForeignKey("patient_types.patient_type_id")
    )
    department: Mapped[str | None] = mapped_column(String(150))
    program: Mapped[str | None] = mapped_column(String(150))
    year_level: Mapped[str | None] = mapped_column(String(50))

    patient_type = relationship("PatientType", lazy="joined")
    visits = relationship(
        "Visit", back_populates="patient", order_by="Visit.started_at.desc()"
    )
    special_cases = relationship(
        "PatientSpecialCase", back_populates="patient", lazy="selectin"
    )

    @property
    def full_name(self) -> str:
        mid = f" {self.middle_name[0]}." if self.middle_name else ""
        return f"{self.last_name}, {self.first_name}{mid}"

    @property
    def age(self) -> int | None:
        """Derived, never stored — a stored age is wrong within a year."""
        if not self.date_of_birth:
            return None
        today = date.today()
        return (
            today.year
            - self.date_of_birth.year
            - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
        )


class PatientSpecialCase(Base):
    """Keyed to the patient, so a flag appears on every future visit.
    origin_visit_id records where it was first noticed."""
    __tablename__ = "patient_special_cases"

    patient_special_case_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.patient_id"), nullable=False
    )
    special_case_type_id: Mapped[int] = mapped_column(
        ForeignKey("special_case_types.special_case_type_id"), nullable=False
    )
    origin_visit_id: Mapped[int | None] = mapped_column(ForeignKey("visits.visit_id"))
    notes: Mapped[str | None] = mapped_column(Text)
    flagged_by: Mapped[int | None] = mapped_column(ForeignKey("users.user_id"))
    flagged_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp(), nullable=False
    )
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # active_type_key is a generated column in MySQL — never write to it.
    # It holds the type id while active and NULL once retired, which is how
    # UNIQUE(patient_id, active_type_key) allows one live flag per type
    # plus unlimited retired history.

    patient = relationship("Patient", back_populates="special_cases")
    case_type = relationship("SpecialCaseType", lazy="joined")
