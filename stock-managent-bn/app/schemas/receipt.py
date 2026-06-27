from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ReceiptItemCreate(BaseModel):
    product_id: int | None = None
    barcode: str | None = None
    quantity: int = Field(gt=0)

    @model_validator(mode="after")
    def check_identifier(self) -> "ReceiptItemCreate":
        if not self.product_id and not self.barcode:
            raise ValueError("Either product_id or barcode must be provided")
        return self


class ReceiptCreate(BaseModel):
    client_name: str
    items: list[ReceiptItemCreate]


class ReceiptItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    subtotal: Decimal


class ReceiptRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    receipt_number: str
    client_name: str
    total_amount: Decimal
    checked_out_by_id: int
    created_at: datetime
    items: list[ReceiptItemRead] = []
