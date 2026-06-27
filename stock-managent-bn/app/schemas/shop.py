from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ShopCreate(BaseModel):
    name: str
    location: str | None = None
    manager_id: int | None = None


class ShopUpdate(BaseModel):
    name: str | None = None
    location: str | None = None


class ShopManagerAssign(BaseModel):
    manager_id: int | None = None


class ShopRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    location: str | None
    manager_id: int | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
