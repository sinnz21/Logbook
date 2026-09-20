"""Stock & Supplies + restock requisitions.

Every quantity change goes through app/services/stock_service.py (row lock +
ledger row). This module never assigns stock.quantity directly.
"""
from datetime import datetime, timezone
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_admin, require_nurse
from app.db.session import get_db
from app.models.inventory import (
    Medicine, MedicineStock, StockRequest, StockRequestItem, Supply, SupplyStock,
)
from app.models.lookups import ItemCategory
from app.models.user import User
from app.schemas.common import Page
from app.schemas.stock import (
    AdjustIn, ApproveIn, DenyIn, RestockIn, StockItemCreate, StockItemOut, StockItemUpdate,
    StockRequestCreate, StockRequestItemOut, StockRequestOut,
)
from app.services import stock_service
from app.services.stock_service import InsufficientStock

router = APIRouter(prefix="/stock", tags=["stock"])

ItemType = Literal["medicine", "supply"]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _status(quantity: Decimal, reorder_level: Decimal) -> str:
    """Same rule as the stock_status generated column (DB plan v2 §14). Computed
    here too so a response right after an update is never stale."""
    if quantity <= 0:
        return "out_of_stock"
    if quantity <= reorder_level:
        return "low"
    return "high"


def _user_names(db: Session, ids) -> dict[int, str]:
    ids = {i for i in ids if i is not None}
    if not ids:
        return {}
    return {u.user_id: u.full_name for u in db.execute(select(User).where(User.user_id.in_(ids))).scalars()}


def _item_out(item, item_type: str, names: dict[int, str]) -> StockItemOut:
    stock = item.stock
    qty = stock.quantity if stock else Decimal(0)
    reorder = stock.reorder_level if stock else Decimal(0)
    return StockItemOut(
        item_type=item_type,
        item_id=item.medicine_id if item_type == "medicine" else item.supply_id,
        name=item.medicine_name if item_type == "medicine" else item.supply_name,
        category_id=item.category_id,
        category_name=item.category.category_name if item.category else None,
        unit=item.unit,
        description=item.description,
        quantity=qty,
        reorder_level=reorder,
        expiry_date=stock.expiry_date if stock else None,
        stock_status=_status(qty, reorder),
        updated_by_name=names.get(stock.updated_by) if stock else None,
        updated_at=stock.updated_at if stock else None,
    )


def _get_item(db: Session, item_type: str, item_id: int):
    model = Medicine if item_type == "medicine" else Supply
    item = db.get(model, item_id)
    if item is None or item.deleted_at is not None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"{item_type.capitalize()} not found")
    return item


def _single_item_out(db: Session, item_type: str, item) -> StockItemOut:
    db.refresh(item)
    if item.stock:
        db.refresh(item.stock)
    return _item_out(item, item_type, _user_names(db, [item.stock.updated_by if item.stock else None]))


def _check_category(db: Session, category_id: int | None, item_type: str) -> None:
    if category_id is None:
        return
    cat = db.get(ItemCategory, category_id)
    if cat is None or cat.applies_to not in (item_type, "both"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Category {category_id} doesn't apply to {item_type}s")


# ------------------------------------------------------------------ requests
# Declared before "/{item_type}/{item_id}" routes so "requests" isn't read as an item type.

def _request_out(db: Session, r: StockRequest) -> StockRequestOut:
    names = _user_names(db, [r.requested_by, r.approved_by, r.received_by])
    items = []
    for i in r.items:
        thing = i.medicine if i.item_type == "medicine" else i.supply
        items.append(StockRequestItemOut(
            request_item_id=i.request_item_id,
            item_type=i.item_type,
            item_id=i.medicine_id if i.item_type == "medicine" else i.supply_id,
            item_name=thing.medicine_name if i.item_type == "medicine" else thing.supply_name,
            unit=thing.unit,
            category_name=thing.category.category_name if thing.category else None,
            requested_quantity=i.requested_quantity,
            approved_quantity=i.approved_quantity,
            reason=i.reason,
        ))
    return StockRequestOut(
        request_id=r.request_id,
        status=r.status,
        request_date=r.request_date,
        requested_by=r.requested_by,
        requested_by_name=names.get(r.requested_by),
        approved_by_name=names.get(r.approved_by),
        approved_at=r.approved_at,
        received_by_name=names.get(r.received_by),
        received_at=r.received_at,
        admin_response=r.admin_response,
        remarks=r.remarks,
        items=items,
    )


def _get_request(db: Session, request_id: int, expected_status: str) -> StockRequest:
    r = db.get(StockRequest, request_id)
    if r is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found")
    if r.status != expected_status:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Request is {r.status}, not {expected_status}")
    return r


@router.get("/requests", response_model=Page[StockRequestOut])
def list_requests(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=200),
):
    stmt = select(StockRequest).order_by(StockRequest.request_date.desc(), StockRequest.request_id.desc())
    if status_filter:
        stmt = stmt.where(StockRequest.status == status_filter)
    rows = db.execute(stmt).scalars().all()
    chunk = rows[(page - 1) * per_page: page * per_page]
    return Page(items=[_request_out(db, r) for r in chunk], total=len(rows), page=page, per_page=per_page)


@router.post("/requests", response_model=StockRequestOut, status_code=status.HTTP_201_CREATED)
def create_request(body: StockRequestCreate, db: Session = Depends(get_db), user: User = Depends(require_nurse)):
    for i in body.items:
        _get_item(db, i.item_type, i.medicine_id if i.item_type == "medicine" else i.supply_id)
    r = StockRequest(requested_by=user.user_id, status="pending", remarks=body.remarks)
    r.items = [
        StockRequestItem(
            item_type=i.item_type, medicine_id=i.medicine_id, supply_id=i.supply_id,
            requested_quantity=i.requested_quantity, reason=i.reason,
        )
        for i in body.items
    ]
    db.add(r)
    db.commit()
    db.refresh(r)
    return _request_out(db, r)


@router.post("/requests/{request_id}/approve", response_model=StockRequestOut)
def approve_request(request_id: int, body: ApproveIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    r = _get_request(db, request_id, "pending")
    overrides = {i.request_item_id: i.approved_quantity for i in body.items}
    for item in r.items:
        item.approved_quantity = overrides.get(item.request_item_id, item.requested_quantity)
    r.status = "approved"
    r.approved_by = user.user_id
    r.approved_at = _utcnow()
    r.admin_response = body.admin_response
    db.commit()
    db.refresh(r)
    return _request_out(db, r)


@router.post("/requests/{request_id}/deny", response_model=StockRequestOut)
def deny_request(request_id: int, body: DenyIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    r = _get_request(db, request_id, "pending")
    r.status = "denied"
    r.approved_by = user.user_id      # who decided
    r.approved_at = _utcnow()
    r.admin_response = body.admin_response
    db.commit()
    db.refresh(r)
    return _request_out(db, r)


@router.post("/requests/{request_id}/receive", response_model=StockRequestOut)
def receive_request(request_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Delivery arrived: one transaction increments stock for every approved line,
    writes 'restocked' ledger rows, and closes the ticket."""
    r = _get_request(db, request_id, "approved")
    try:
        for item in r.items:
            qty = item.approved_quantity or item.requested_quantity
            if item.item_type == "medicine":
                stock_service.restock_medicine(db, item.medicine_id, qty, r.request_id, user.user_id)
            else:
                stock_service.restock_supply(db, item.supply_id, qty, r.request_id, user.user_id)
        r.status = "completed"
        r.received_by = user.user_id
        r.received_at = _utcnow()
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(r)
    return _request_out(db, r)


# ------------------------------------------------------------------ items

@router.get("", response_model=Page[StockItemOut])
def list_stock(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    item_type: ItemType | None = None,
    status_filter: Literal["high", "low", "out_of_stock"] | None = Query(None, alias="status"),
    category_id: int | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(200, ge=1, le=500),
):
    items: list[StockItemOut] = []
    sources = [("medicine", Medicine, Medicine.medicine_name), ("supply", Supply, Supply.supply_name)]
    raw = []
    for kind, model, name_col in sources:
        if item_type and item_type != kind:
            continue
        stmt = select(model).where(model.deleted_at.is_(None), model.active.is_(True))
        if category_id is not None:
            stmt = stmt.where(model.category_id == category_id)
        if search:
            stmt = stmt.where(name_col.ilike(f"%{search.strip()}%"))
        raw += [(kind, m) for m in db.execute(stmt).unique().scalars()]

    names = _user_names(db, [m.stock.updated_by for _, m in raw if m.stock])
    items = [_item_out(m, kind, names) for kind, m in raw]
    if status_filter:
        items = [i for i in items if i.stock_status == status_filter]
    items.sort(key=lambda i: i.name.lower())

    chunk = items[(page - 1) * per_page: page * per_page]
    return Page(items=chunk, total=len(items), page=page, per_page=per_page)


@router.post("", response_model=StockItemOut, status_code=status.HTTP_201_CREATED)
def create_item(body: StockItemCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """New catalog item + its stock row. Opening quantity goes through the
    ledger like any other restock."""
    _check_category(db, body.category_id, body.item_type)
    try:
        if body.item_type == "medicine":
            item = Medicine(medicine_name=body.name, category_id=body.category_id, unit=body.unit, description=body.description)
            db.add(item)
            db.flush()
            db.add(MedicineStock(medicine_id=item.medicine_id, quantity=0, reorder_level=body.reorder_level,
                                 expiry_date=body.expiry_date, updated_by=user.user_id))
            db.flush()
            if body.quantity > 0:
                stock_service.restock_medicine(db, item.medicine_id, body.quantity, None, user.user_id)
        else:
            item = Supply(supply_name=body.name, category_id=body.category_id, unit=body.unit, description=body.description)
            db.add(item)
            db.flush()
            db.add(SupplyStock(supply_id=item.supply_id, quantity=0, reorder_level=body.reorder_level,
                               expiry_date=body.expiry_date, updated_by=user.user_id))
            db.flush()
            if body.quantity > 0:
                stock_service.restock_supply(db, item.supply_id, body.quantity, None, user.user_id)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, f'"{body.name}" already exists')
    return _single_item_out(db, body.item_type, item)


@router.patch("/{item_type}/{item_id}", response_model=StockItemOut)
def update_item(
    item_type: ItemType, item_id: int, body: StockItemUpdate,
    db: Session = Depends(get_db), user: User = Depends(get_current_user),
):
    item = _get_item(db, item_type, item_id)
    data = body.model_dump(exclude_unset=True)
    if "category_id" in data:
        _check_category(db, data["category_id"], item_type)
    for field in ("category_id", "description"):      # nullable — an explicit null clears them
        if field in data:
            setattr(item, field, data[field])
    if data.get("unit"):
        item.unit = data["unit"]
    if data.get("name"):
        setattr(item, "medicine_name" if item_type == "medicine" else "supply_name", data["name"])
    if item.stock and ("reorder_level" in data or "expiry_date" in data):
        if data.get("reorder_level") is not None:
            item.stock.reorder_level = data["reorder_level"]
        if "expiry_date" in data:
            item.stock.expiry_date = data["expiry_date"]
        item.stock.updated_by = user.user_id
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, f'"{data.get("name")}" already exists')
    return _single_item_out(db, item_type, item)


@router.post("/{item_type}/{item_id}/restock", response_model=StockItemOut)
def restock_item(
    item_type: ItemType, item_id: int, body: RestockIn,
    db: Session = Depends(get_db), user: User = Depends(get_current_user),
):
    item = _get_item(db, item_type, item_id)
    try:
        if item_type == "medicine":
            stock_service.restock_medicine(db, item_id, body.quantity, None, user.user_id)
        else:
            stock_service.restock_supply(db, item_id, body.quantity, None, user.user_id)
        if body.expiry_date is not None:
            item.stock.expiry_date = body.expiry_date
        db.commit()
    except ValueError as e:
        db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    return _single_item_out(db, item_type, item)


@router.post("/{item_type}/{item_id}/adjust", response_model=StockItemOut)
def adjust_item(
    item_type: ItemType, item_id: int, body: AdjustIn,
    db: Session = Depends(get_db), user: User = Depends(get_current_user),
):
    item = _get_item(db, item_type, item_id)
    try:
        stock_service.adjust(
            db, item_type=item_type, item_id=item_id, delta=body.delta,
            reason=body.reason, transaction_type=body.transaction_type, user_id=user.user_id,
        )
        db.commit()
    except InsufficientStock as e:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))
    return _single_item_out(db, item_type, item)
