from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.unit import Unit
from app.schemas.unit import UnitCreate
from app.services.exceptions import ConflictError, NotFoundError


def create_unit(db: Session, data: UnitCreate) -> Unit:
    if db.execute(select(Unit.id).where(Unit.name == data.name)).first():
        raise ConflictError(f"Unit '{data.name}' already exists")
    unit = Unit(**data.model_dump())
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return unit


def list_units(db: Session) -> list[Unit]:
    return list(db.execute(select(Unit).order_by(Unit.name)).scalars().all())


def get_unit(db: Session, unit_id: int) -> Unit:
    unit = db.get(Unit, unit_id)
    if unit is None:
        raise NotFoundError(f"Unit {unit_id} not found")
    return unit
