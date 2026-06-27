from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin, require_admin_only
from app.schemas.shop import ShopCreate, ShopManagerAssign, ShopRead, ShopUpdate
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


@router.get("/{shop_id}", response_model=ShopRead)
def get_shop(shop_id: int, db: Session = Depends(get_db)):
    try:
        return shop_service.get_shop(db, shop_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/{shop_id}", response_model=ShopRead, dependencies=[Depends(require_admin_only)])
def update_shop(shop_id: int, data: ShopUpdate, db: Session = Depends(get_db)):
    try:
        return shop_service.update_shop(db, shop_id, data)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.patch("/{shop_id}/manager", response_model=ShopRead, dependencies=[Depends(require_admin_only)])
def assign_manager(shop_id: int, data: ShopManagerAssign, db: Session = Depends(get_db)):
    try:
        return shop_service.assign_manager(db, shop_id, data)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.delete("/{shop_id}", status_code=204, dependencies=[Depends(require_admin_only)])
def delete_shop(shop_id: int, db: Session = Depends(get_db)):
    try:
        shop_service.delete_shop(db, shop_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
