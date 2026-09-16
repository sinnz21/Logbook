"""Lookup tables. Adding a value here is an INSERT, never a migration."""
from sqlalchemy import Boolean, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PatientType(Base):
    __tablename__ = "patient_types"
    patient_type_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    type_name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Complaint(Base):
    """Controlled vocabulary. Every Insights figure counts these — free text
    cannot be grouped."""
    __tablename__ = "complaints"
    complaint_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    complaint_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Disposition(Base):
    __tablename__ = "dispositions"
    disposition_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    disposition_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class SpecialCaseType(Base):
    __tablename__ = "special_case_types"
    special_case_type_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class ItemCategory(Base):
    __tablename__ = "item_categories"
    category_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    category_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    applies_to: Mapped[str] = mapped_column(
        Enum("medicine", "supply", "both"), default="medicine", nullable=False
    )
    description: Mapped[str | None] = mapped_column(String(255))
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
