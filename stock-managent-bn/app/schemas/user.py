from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CashierCreate(BaseModel):
    username: str
    full_name: str | None = None


class CashierRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str | None
    created_at: datetime
