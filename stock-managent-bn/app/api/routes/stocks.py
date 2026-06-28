from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.schemas.stock import StockCreate, StockRead
from app.services import stock_service
from app.services.exceptions import ConflictError, NotFoundError

router = APIRouter(prefix="/stocks", tags=["stocks"], dependencies=[Depends(require_admin)])


@router.post("", response_model=StockRead, status_code=201)
def create_stock(data: StockCreate, db: Session = Depends(get_db)):
    try:
        return stock_service.create_stock(db, data)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("", response_model=list[StockRead])
def list_stocks(shop_id: int | None = None, db: Session = Depends(get_db)):
    return stock_service.list_stocks(db, shop_id=shop_id)
