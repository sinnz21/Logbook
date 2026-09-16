from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger, Boolean, Date, DateTime, Enum, ForeignKey, Integer, Numeric,
    String, Text, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin


class Medicine(Base, TimestampMixin, SoftDeleteMixin):
    """What exists. How much is on hand lives in MedicineStock."""
    __tablename__ = "medicines"

    medicine_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    medicine_name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("item_categories.category_id")
    )
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    category = relationship("ItemCategory", lazy="joined")
    stock = relationship("MedicineStock", back_populates="medicine", uselist=False,
                         lazy="joined")


class Supply(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "supplies"

    supply_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    supply_name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("item_categories.category_id")
    )
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    category = relationship("ItemCategory", lazy="joined")
    stock = relationship("SupplyStock", back_populates="supply", uselist=False,
                         lazy="joined")


class MedicineStock(Base):
    """stock_status is a GENERATED column in MySQL. Never assign to it —
    SQLAlchemy reads it, the database maintains it."""
    __tablename__ = "medicine_stock"

    stock_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    medicine_id: Mapped[int] = mapped_column(
        ForeignKey("medicines.medicine_id"), unique=True, nullable=False
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    reorder_level: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    expiry_date: Mapped[date | None] = mapped_column(Date)
    stock_status: Mapped[str] = mapped_column(
        Enum("high", "low", "out_of_stock"),
        server_default="out_of_stock", nullable=False,
    )
    updated_by: Mapped[int | None] = mapped_column(ForeignKey("users.user_id"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp(), nullable=False
    )

    medicine = relationship("Medicine", back_populates="stock")

    __mapper_args__ = {"exclude_properties": []}


class SupplyStock(Base):
    __tablename__ = "supply_stock"

    supply_stock_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    supply_id: Mapped[int] = mapped_column(
        ForeignKey("supplies.supply_id"), unique=True, nullable=False
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    reorder_level: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    expiry_date: Mapped[date | None] = mapped_column(Date)
    stock_status: Mapped[str] = mapped_column(
        Enum("high", "low", "out_of_stock"),
        server_default="out_of_stock", nullable=False,
    )
    updated_by: Mapped[int | None] = mapped_column(ForeignKey("users.user_id"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp(), nullable=False
    )

    supply = relationship("Supply", back_populates="stock")


class StockRequest(Base):
    """draft -> pending -> approved/denied -> completed"""
    __tablename__ = "stock_requests"

    request_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    requested_by: Mapped[int] = mapped_column(ForeignKey("users.user_id"), nullable=False)
    request_date: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp(), nullable=False
    )
    status: Mapped[str] = mapped_column(
        Enum("draft", "pending", "approved", "denied", "completed"),
        default="pending", nullable=False,
    )
    approved_by: Mapped[int | None] = mapped_column(ForeignKey("users.user_id"))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime)
    received_by: Mapped[int | None] = mapped_column(ForeignKey("users.user_id"))
    received_at: Mapped[datetime | None] = mapped_column(DateTime)
    admin_response: Mapped[str | None] = mapped_column(Text)
    remarks: Mapped[str | None] = mapped_column(Text)

    items = relationship(
        "StockRequestItem", cascade="all, delete-orphan", lazy="selectin"
    )


class StockRequestItem(Base):
    """requested_quantity and approved_quantity stay separate — Admin may
    approve less than was asked for."""
    __tablename__ = "stock_request_items"

    request_item_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    request_id: Mapped[int] = mapped_column(
        ForeignKey("stock_requests.request_id"), nullable=False
    )
    item_type: Mapped[str] = mapped_column(Enum("medicine", "supply"), nullable=False)
    medicine_id: Mapped[int | None] = mapped_column(ForeignKey("medicines.medicine_id"))
    supply_id: Mapped[int | None] = mapped_column(ForeignKey("supplies.supply_id"))
    requested_quantity: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    approved_quantity: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    reason: Mapped[str | None] = mapped_column(String(255))

    medicine = relationship("Medicine", lazy="joined")
    supply = relationship("Supply", lazy="joined")


class InventoryTransaction(Base):
    """Append-only ledger. Never UPDATE or DELETE — correct a mistake by
    writing an 'adjustment' row. quantity is signed."""
    __tablename__ = "inventory_transactions"

    transaction_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    item_type: Mapped[str] = mapped_column(Enum("medicine", "supply"), nullable=False)
    medicine_id: Mapped[int | None] = mapped_column(ForeignKey("medicines.medicine_id"))
    supply_id: Mapped[int | None] = mapped_column(ForeignKey("supplies.supply_id"))
    transaction_type: Mapped[str] = mapped_column(
        Enum("released", "restocked", "adjustment", "expired", "damaged"), nullable=False
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    reference_type: Mapped[str | None] = mapped_column(
        Enum("visit", "stock_request", "manual")
    )
    reference_id: Mapped[int | None] = mapped_column(Integer)
    performed_by: Mapped[int | None] = mapped_column(ForeignKey("users.user_id"))
    transaction_date: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp(), nullable=False
    )
    remarks: Mapped[str | None] = mapped_column(Text)
