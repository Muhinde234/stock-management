from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ReceiptItemCreate(BaseModel):
    product_id: int | None = None
    sku: str | None = None
    quantity: int = Field(gt=0)

    @model_validator(mode="after")
    def check_identifier(self) -> "ReceiptItemCreate":
        if not self.product_id and not self.sku:
            raise ValueError("Either product_id or sku must be provided")
        return self


class ReceiptCreate(BaseModel):
    client_name: str
    client_phone: str
    items: list[ReceiptItemCreate]


class ReceiptProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sku: str


class ReceiptItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product: ReceiptProductRead
    quantity: int
    unit_price: Decimal
    subtotal: Decimal


class ReceiptRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    receipt_number: str
    client_name: str
    client_phone: str
    total_amount: Decimal
    checked_out_by_id: int
    created_at: datetime
    items: list[ReceiptItemRead] = []
