from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import PaymentMethod, SaleStatus


class SaleItemCreate(BaseModel):
    product_id: int | None = None
    barcode: str | None = None
    quantity: int = Field(gt=0)

    @model_validator(mode="after")
    def check_identifier(self) -> "SaleItemCreate":
        if not self.product_id and not self.barcode:
            raise ValueError("Either product_id or barcode must be provided")
        return self


class SaleCreate(BaseModel):
    items: list[SaleItemCreate]
    discount_amount: Decimal = Field(default=Decimal("0"), ge=0)
    tax_amount: Decimal = Field(default=Decimal("0"), ge=0)
    payment_method: PaymentMethod
    cash_received: Decimal | None = Field(default=None, ge=0)


class SaleItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    subtotal: Decimal


class SaleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sale_number: str
    sale_date: datetime
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    grand_total: Decimal
    payment_method: PaymentMethod
    cash_received: Decimal | None
    change_due: Decimal
    status: SaleStatus
    cashier_id: int
    items: list[SaleItemRead] = []
