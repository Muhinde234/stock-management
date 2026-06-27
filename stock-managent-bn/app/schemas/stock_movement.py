from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import StockMovementStatus


class StockMovementCreate(BaseModel):
    barcode: str
    status: StockMovementStatus
    quantity: int = Field(gt=0)


class StockMovementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    status: StockMovementStatus
    quantity: int
    performed_by_id: int
    created_at: datetime
