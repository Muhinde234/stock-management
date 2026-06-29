from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_admin
from app.schemas.unit import UnitCreate, UnitRead
from app.services import unit_service
from app.services.exceptions import ConflictError

router = APIRouter(prefix="/units", tags=["units"], dependencies=[Depends(get_current_user)])


@router.post("", response_model=UnitRead, status_code=201, dependencies=[Depends(require_admin)])
def create_unit(data: UnitCreate, db: Session = Depends(get_db)):
    try:
        return unit_service.create_unit(db, data)
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("", response_model=list[UnitRead])
def list_units(db: Session = Depends(get_db)):
    return unit_service.list_units(db)
