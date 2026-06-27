from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import PurchaseType


class PurchaseOrderCreate(BaseModel):
    purchase_type: PurchaseType
    scanned_code: str
    product_id: int
    quantity: int = Field(gt=0)


class PurchaseOrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    purchase_type: PurchaseType
    scanned_code: str
    product_id: int
    quantity: int
    quantity_unit: str
    unit_price: Decimal
    received_by_id: int
    created_at: datetime
