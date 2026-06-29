from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ShopCreate(BaseModel):
    name: str = Field(alias="shopName")
    address: str
    phone: str
    email: str | None = None


class ShopUpdate(BaseModel):
    name: str | None = Field(default=None, alias="shopName")
    address: str | None = None
    phone: str | None = None
    email: str | None = None


class ShopManagerAssign(BaseModel):
    manager_id: int | None = None


class ShopRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    name: str = Field(alias="shopName")
    address: str
    phone: str
    email: str | None
    manager_id: int | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
