from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import Field, model_validator

from app.schemas.common import APIModel

ItemType = Literal["medicine", "supply"]


class StockItemOut(APIModel):
    """A medicine or supply plus its live stock row. Both tables share one
    screen, so the API addresses them as (item_type, item_id)."""
    item_type: ItemType
    item_id: int
    name: str
    category_id: int | None = None
    category_name: str | None = None
    unit: str
    description: str | None = None
    quantity: Decimal
    reorder_level: Decimal
    expiry_date: date | None = None
    stock_status: Literal["high", "low", "out_of_stock"]
    updated_by_name: str | None = None
    updated_at: datetime | None = None


class StockItemCreate(APIModel):
    item_type: ItemType
    name: str = Field(min_length=1, max_length=150)
    category_id: int | None = None
    unit: str = Field(min_length=1, max_length=50)
    description: str | None = None
    quantity: Decimal = Field(default=Decimal(0), ge=0)       # opening stock
    reorder_level: Decimal = Field(default=Decimal(0), ge=0)
    expiry_date: date | None = None


class StockItemUpdate(APIModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    category_id: int | None = None
    unit: str | None = Field(default=None, min_length=1, max_length=50)
    description: str | None = None
    reorder_level: Decimal | None = Field(default=None, ge=0)
    expiry_date: date | None = None


class RestockIn(APIModel):
    quantity: Decimal = Field(gt=0)
    expiry_date: date | None = None     # new batch expiry, if it changed


class AdjustIn(APIModel):
    delta: Decimal                       # signed: negative removes stock
    transaction_type: Literal["adjustment", "expired", "damaged"] = "adjustment"
    reason: str = Field(min_length=1)

    @model_validator(mode="after")
    def _nonzero(self):
        if self.delta == 0:
            raise ValueError("delta must not be 0")
        return self


class StockRequestItemIn(APIModel):
    item_type: ItemType
    medicine_id: int | None = None
    supply_id: int | None = None
    requested_quantity: Decimal = Field(gt=0)
    reason: str | None = Field(default=None, max_length=255)

    @model_validator(mode="after")
    def _one_item(self):
        # mirrors the CHECK constraint on stock_request_items
        if (self.item_type == "medicine") != (self.medicine_id is not None and self.supply_id is None):
            raise ValueError("medicine items need medicine_id only; supply items need supply_id only")
        return self


class StockRequestCreate(APIModel):
    items: list[StockRequestItemIn] = Field(min_length=1)
    remarks: str | None = None


class StockRequestItemOut(APIModel):
    request_item_id: int
    item_type: ItemType
    item_id: int
    item_name: str
    unit: str
    category_name: str | None = None
    requested_quantity: Decimal
    approved_quantity: Decimal | None = None
    reason: str | None = None


class StockRequestOut(APIModel):
    request_id: int
    status: str
    request_date: datetime
    requested_by: int
    requested_by_name: str | None = None
    approved_by_name: str | None = None
    approved_at: datetime | None = None
    received_by_name: str | None = None
    received_at: datetime | None = None
    admin_response: str | None = None
    remarks: str | None = None
    items: list[StockRequestItemOut]


class ApproveItemIn(APIModel):
    request_item_id: int
    approved_quantity: Decimal = Field(gt=0)


class ApproveIn(APIModel):
    """Omit `items` to approve every line at its requested quantity."""
    items: list[ApproveItemIn] = []
    admin_response: str | None = None


class DenyIn(APIModel):
    admin_response: str | None = None
