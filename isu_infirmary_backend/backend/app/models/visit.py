from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin


class Visit(Base, TimestampMixin, SoftDeleteMixin):
    """One clinic encounter, arrival to sign-out.

    status      = where the visit is in the workflow
    disposition = how it ended
    These are separate on purpose.
    """
    __tablename__ = "visits"

    visit_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.patient_id"), nullable=False
    )
    attending_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.user_id"))

    chief_complaint: Mapped[str] = mapped_column(Text, nullable=False)
    management: Mapped[str | None] = mapped_column(Text)
    treatment_notes: Mapped[str | None] = mapped_column(Text)

    blood_pressure: Mapped[str | None] = mapped_column(String(20))
    temperature: Mapped[Decimal | None] = mapped_column(Numeric(4, 1))
    pulse_rate: Mapped[int | None] = mapped_column(Integer)

    disposition_id: Mapped[int | None] = mapped_column(
        ForeignKey("dispositions.disposition_id")
    )
    started_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(
        Enum("waiting", "in_care", "completed", "cancelled"),
        default="waiting", nullable=False,
    )

    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.user_id"))
    updated_by: Mapped[int | None] = mapped_column(ForeignKey("users.user_id"))

    patient = relationship("Patient", back_populates="visits", lazy="joined")
    disposition = relationship("Disposition", lazy="joined")
    complaints = relationship(
        "VisitComplaint", cascade="all, delete-orphan", lazy="selectin"
    )
    medicines = relationship(
        "VisitMedicine", cascade="all, delete-orphan", lazy="selectin"
    )
    supplies = relationship(
        "VisitSupply", cascade="all, delete-orphan", lazy="selectin"
    )

    @property
    def duration_minutes(self) -> int | None:
        if not self.ended_at:
            return None
        return int((self.ended_at - self.started_at).total_seconds() // 60)


class VisitComplaint(Base):
    """One visit may record several complaints.

    This is the table the association mining runs on — co-occurrence needs two
    rows for one visit, which a single TEXT column cannot express.
    """
    __tablename__ = "visit_complaints"

    visit_complaint_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    visit_id: Mapped[int] = mapped_column(ForeignKey("visits.visit_id"), nullable=False)
    complaint_id: Mapped[int] = mapped_column(
        ForeignKey("complaints.complaint_id"), nullable=False
    )
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    complaint = relationship("Complaint", lazy="joined")


class VisitMedicine(Base):
    __tablename__ = "visit_medicines"

    visit_medicine_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    visit_id: Mapped[int] = mapped_column(ForeignKey("visits.visit_id"), nullable=False)
    medicine_id: Mapped[int] = mapped_column(
        ForeignKey("medicines.medicine_id"), nullable=False
    )
    quantity_given: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    dosage: Mapped[str | None] = mapped_column(String(100))
    instructions: Mapped[str | None] = mapped_column(String(255))
    given_by: Mapped[int | None] = mapped_column(ForeignKey("users.user_id"))
    given_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp(), nullable=False
    )

    medicine = relationship("Medicine", lazy="joined")


class VisitSupply(Base):
    """Closes the loop v1 left open: supplies can be consumed, not only stocked."""
    __tablename__ = "visit_supplies"

    visit_supply_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    visit_id: Mapped[int] = mapped_column(ForeignKey("visits.visit_id"), nullable=False)
    supply_id: Mapped[int] = mapped_column(
        ForeignKey("supplies.supply_id"), nullable=False
    )
    quantity_used: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    remarks: Mapped[str | None] = mapped_column(String(255))
    given_by: Mapped[int | None] = mapped_column(ForeignKey("users.user_id"))
    given_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp(), nullable=False
    )

    supply = relationship("Supply", lazy="joined")
