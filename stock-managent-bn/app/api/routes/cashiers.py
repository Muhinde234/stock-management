from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.user import CashierCreate, CashierRead
from app.services import cashier_service
from app.services.exceptions import ConflictError

router = APIRouter(prefix="/cashiers", tags=["cashiers"])


@router.post("", response_model=CashierRead, status_code=201)
def create_cashier(data: CashierCreate, db: Session = Depends(get_db)):
    try:
        return cashier_service.create_cashier(db, data)
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("", response_model=list[CashierRead])
def list_cashiers(db: Session = Depends(get_db)):
    return cashier_service.list_cashiers(db)
