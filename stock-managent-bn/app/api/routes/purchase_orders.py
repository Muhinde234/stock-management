from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_stock_keeper
from app.models.user import User
from app.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderRead
from app.services import purchase_order_service
from app.services.exceptions import ConflictError, NotFoundError

router = APIRouter(
    prefix="/purchases",
    tags=["purchases"],
    dependencies=[Depends(require_stock_keeper)],
)


@router.post("", response_model=PurchaseOrderRead, status_code=201)
def create_purchase_order(
    data: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return purchase_order_service.record_purchase_order(db, data, current_user)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("", response_model=list[PurchaseOrderRead])
def list_purchase_orders(
    product_id: int | None = None, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)
):
    return purchase_order_service.list_purchase_orders(db, product_id=product_id, skip=skip, limit=limit)


@router.get("/{purchase_order_id}", response_model=PurchaseOrderRead)
def get_purchase_order(purchase_order_id: int, db: Session = Depends(get_db)):
    try:
        return purchase_order_service.get_purchase_order(db, purchase_order_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.delete("/{purchase_order_id}", status_code=204)
def delete_purchase_order(purchase_order_id: int, db: Session = Depends(get_db)):
    """Deleting a purchase order reverses the stock it added, then removes the record."""
    try:
        purchase_order_service.delete_purchase_order(db, purchase_order_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
