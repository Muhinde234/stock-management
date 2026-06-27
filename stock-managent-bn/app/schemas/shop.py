from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ShopCreate(BaseModel):
    name: str
    location: str | None = None
    manager_id: int | None = None


class ShopUpdate(BaseModel):
    manager_id: int | None = None


class ShopRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    location: str | None
    manager_id: int | None
    created_at: datetime
    updated_at: datetime
