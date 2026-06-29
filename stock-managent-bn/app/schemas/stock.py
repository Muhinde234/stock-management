from datetime import datetime

from pydantic import BaseModel, ConfigDict


class StockCreate(BaseModel):
    name: str
    shop_id: int
    stock_keeper_id: int | None = None
    cashier_id: int | None = None


class StockUpdate(BaseModel):
    name: str | None = None
    stock_keeper_id: int | None = None
    cashier_id: int | None = None


class StockRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    shop_id: int
    stock_keeper_id: int | None
    cashier_id: int | None
    created_at: datetime
    updated_at: datetime
