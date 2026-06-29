from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_admin
from app.models.user import User
from app.schemas.stock import StockCreate, StockRead, StockUpdate
from app.services import stock_service
from app.services.exceptions import ConflictError, NotFoundError, PermissionDeniedError

router = APIRouter(prefix="/stocks", tags=["stocks"], dependencies=[Depends(require_admin)])


@router.post("", response_model=StockRead, status_code=201)
def create_stock(data: StockCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        return stock_service.create_stock(db, data, current_user)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except PermissionDeniedError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.get("", response_model=list[StockRead])
def list_stocks(
    shop_id: int | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return stock_service.list_stocks(db, current_user, shop_id=shop_id)


@router.get("/{stock_id}", response_model=StockRead)
def get_stock(stock_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        return stock_service.get_stock(db, stock_id, current_user)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionDeniedError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.patch("/{stock_id}", response_model=StockRead)
def update_stock(
    stock_id: int, data: StockUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    try:
        return stock_service.update_stock(db, stock_id, data, current_user)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except PermissionDeniedError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.delete("/{stock_id}", status_code=204)
def delete_stock(
    stock_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    try:
        stock_service.delete_stock(db, stock_id, current_user)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except PermissionDeniedError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
