from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_stock_keeper
from app.models.user import User
from app.schemas.receipt import ReceiptCreate, ReceiptRead
from app.services import receipt_service
from app.services.exceptions import InsufficientStockError, NotFoundError

router = APIRouter(prefix="/receipts", tags=["receipts"], dependencies=[Depends(require_stock_keeper)])


@router.post("", response_model=ReceiptRead, status_code=201)
def create_receipt(
    data: ReceiptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return receipt_service.create_receipt(db, data, checked_out_by_id=current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InsufficientStockError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("", response_model=list[ReceiptRead])
def list_receipts(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return receipt_service.list_receipts(db, skip=skip, limit=limit)


@router.get("/{receipt_id}", response_model=ReceiptRead)
def get_receipt(receipt_id: int, db: Session = Depends(get_db)):
    try:
        return receipt_service.get_receipt(db, receipt_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
