from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UnitBase(BaseModel):
    name: str = Field(alias="unitName")


class UnitCreate(UnitBase):
    pass


class UnitRead(UnitBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    created_at: datetime
    updated_at: datetime
