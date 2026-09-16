"""Stock movement.

Two rules, both non-negotiable:

1. Every quantity change is made under a row lock (SELECT ... FOR UPDATE).
   Without it, two nurses dispensing the last tablet at the same moment both
   read "1 remaining" and both succeed.

2. Every quantity change writes an inventory_transactions row in the SAME
   transaction. The ledger is the source of truth; stock.quantity is a cached
   running total. If they can ever disagree, the ledger is right.

Never assign to stock_status — it is a generated column in MySQL.
"""
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.inventory import (
    InventoryTransaction, MedicineStock, SupplyStock,
)


class InsufficientStock(Exception):
    def __init__(self, item: str, requested: Decimal, available: Decimal):
        self.item, self.requested, self.available = item, requested, available
        super().__init__(
            f"{item}: requested {requested}, only {available} on hand"
        )


def _lock_medicine(db: Session, medicine_id: int) -> MedicineStock:
    stock = db.execute(
        select(MedicineStock)
        .where(MedicineStock.medicine_id == medicine_id)
        .with_for_update()
    ).scalar_one_or_none()
    if stock is None:
        raise ValueError(f"No stock row for medicine {medicine_id}")
    return stock


def _lock_supply(db: Session, supply_id: int) -> SupplyStock:
    stock = db.execute(
        select(SupplyStock)
        .where(SupplyStock.supply_id == supply_id)
        .with_for_update()
    ).scalar_one_or_none()
    if stock is None:
        raise ValueError(f"No stock row for supply {supply_id}")
    return stock


def release_medicine(
    db: Session, medicine_id: int, qty: Decimal, visit_id: int, user_id: int
) -> None:
    """Dispense during a visit. Caller must already be inside a transaction."""
    stock = _lock_medicine(db, medicine_id)
    if stock.quantity < qty:
        raise InsufficientStock(f"medicine {medicine_id}", qty, stock.quantity)

    stock.quantity -= qty
    stock.updated_by = user_id
    db.add(InventoryTransaction(
        item_type="medicine",
        medicine_id=medicine_id,
        transaction_type="released",
        quantity=-qty,
        reference_type="visit",
        reference_id=visit_id,
        performed_by=user_id,
    ))


def release_supply(
    db: Session, supply_id: int, qty: Decimal, visit_id: int, user_id: int
) -> None:
    stock = _lock_supply(db, supply_id)
    if stock.quantity < qty:
        raise InsufficientStock(f"supply {supply_id}", qty, stock.quantity)

    stock.quantity -= qty
    stock.updated_by = user_id
    db.add(InventoryTransaction(
        item_type="supply",
        supply_id=supply_id,
        transaction_type="released",
        quantity=-qty,
        reference_type="visit",
        reference_id=visit_id,
        performed_by=user_id,
    ))


def restock_medicine(
    db: Session, medicine_id: int, qty: Decimal, request_id: int | None, user_id: int
) -> None:
    stock = _lock_medicine(db, medicine_id)
    stock.quantity += qty
    stock.updated_by = user_id
    db.add(InventoryTransaction(
        item_type="medicine",
        medicine_id=medicine_id,
        transaction_type="restocked",
        quantity=qty,
        reference_type="stock_request" if request_id else "manual",
        reference_id=request_id,
        performed_by=user_id,
    ))


def restock_supply(
    db: Session, supply_id: int, qty: Decimal, request_id: int | None, user_id: int
) -> None:
    stock = _lock_supply(db, supply_id)
    stock.quantity += qty
    stock.updated_by = user_id
    db.add(InventoryTransaction(
        item_type="supply",
        supply_id=supply_id,
        transaction_type="restocked",
        quantity=qty,
        reference_type="stock_request" if request_id else "manual",
        reference_id=request_id,
        performed_by=user_id,
    ))


def adjust(
    db: Session, *, item_type: str, item_id: int, delta: Decimal,
    reason: str, transaction_type: str, user_id: int,
) -> None:
    """Manual correction, expiry write-off or damage.

    Use this instead of editing the ledger. History stays intact.
    """
    if item_type == "medicine":
        stock = _lock_medicine(db, item_id)
        tx = InventoryTransaction(item_type="medicine", medicine_id=item_id)
    else:
        stock = _lock_supply(db, item_id)
        tx = InventoryTransaction(item_type="supply", supply_id=item_id)

    if stock.quantity + delta < 0:
        raise InsufficientStock(f"{item_type} {item_id}", abs(delta), stock.quantity)

    stock.quantity += delta
    stock.updated_by = user_id
    tx.transaction_type = transaction_type
    tx.quantity = delta
    tx.reference_type = "manual"
    tx.performed_by = user_id
    tx.remarks = reason
    db.add(tx)
