from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.schemas.sale import SaleCreate, SaleRead
from app.services import sale_service
from app.services.exceptions import InsufficientStockError, NotFoundError, PaymentFailedError

router = APIRouter(prefix="/sales", tags=["sales"], dependencies=[Depends(require_admin)])


@router.post("", response_model=SaleRead, status_code=201)
def create_sale(data: SaleCreate, db: Session = Depends(get_db)):
    try:
        return sale_service.complete_sale(db, data)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InsufficientStockError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except PaymentFailedError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("", response_model=list[SaleRead])
def list_sales(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return sale_service.list_sales(db, skip=skip, limit=limit)


@router.get("/{sale_id}", response_model=SaleRead)
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    try:
        return sale_service.get_sale(db, sale_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{sale_id}/void", response_model=SaleRead)
def void_sale(sale_id: int, db: Session = Depends(get_db)):
    try:
        return sale_service.void_sale(db, sale_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PaymentFailedError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
