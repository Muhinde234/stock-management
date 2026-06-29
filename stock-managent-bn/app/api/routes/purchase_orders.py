from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_stock_keeper
from app.models.user import User
from app.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderRead
from app.services import purchase_order_service
from app.services.exceptions import ConflictError, NotFoundError

router = APIRouter(
    prefix="/purchase-orders",
    tags=["purchase-orders"],
    dependencies=[Depends(require_stock_keeper)],
)


@router.post("", response_model=PurchaseOrderRead, status_code=201)
def create_purchase_order(
    data: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return purchase_order_service.record_purchase_order(db, data, received_by_id=current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("", response_model=list[PurchaseOrderRead])
def list_purchase_orders(
    product_id: int | None = None, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)
):
    return purchase_order_service.list_purchase_orders(db, product_id=product_id, skip=skip, limit=limit)
