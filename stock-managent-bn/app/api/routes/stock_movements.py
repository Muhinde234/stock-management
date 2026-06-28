from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_stock_keeper
from app.models.user import User
from app.schemas.stock_movement import StockMovementCreate, StockMovementRead
from app.services import stock_movement_service
from app.services.exceptions import InsufficientStockError, NotFoundError

router = APIRouter(
    prefix="/stock-movements",
    tags=["stock-movements"],
    dependencies=[Depends(require_stock_keeper)],
)


@router.post("", response_model=StockMovementRead, status_code=201)
def create_stock_movement(
    data: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return stock_movement_service.record_movement(db, data, performed_by_id=current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InsufficientStockError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("", response_model=list[StockMovementRead])
def list_stock_movements(product_id: int | None = None, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return stock_movement_service.list_movements(db, product_id=product_id, skip=skip, limit=limit)
