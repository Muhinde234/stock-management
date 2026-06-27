from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin, require_admin_only
from app.schemas.shop import ShopCreate, ShopRead, ShopUpdate
from app.services import shop_service
from app.services.exceptions import ConflictError, NotFoundError

router = APIRouter(prefix="/shops", tags=["shops"], dependencies=[Depends(require_admin)])


@router.post("", response_model=ShopRead, status_code=201, dependencies=[Depends(require_admin_only)])
def create_shop(data: ShopCreate, db: Session = Depends(get_db)):
    try:
        return shop_service.create_shop(db, data)
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("", response_model=list[ShopRead])
def list_shops(db: Session = Depends(get_db)):
    return shop_service.list_shops(db)


@router.patch("/{shop_id}/manager", response_model=ShopRead, dependencies=[Depends(require_admin_only)])
def assign_manager(shop_id: int, data: ShopUpdate, db: Session = Depends(get_db)):
    try:
        return shop_service.assign_manager(db, shop_id, data)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
