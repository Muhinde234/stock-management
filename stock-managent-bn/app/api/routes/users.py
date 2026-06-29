from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_admin
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.services import user_service
from app.services.exceptions import ConflictError, NotFoundError, PermissionDeniedError

router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(require_admin)])


@router.post("", response_model=UserRead, status_code=201)
def create_user(data: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        return user_service.create_user(db, data, created_by=current_user)
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except PermissionDeniedError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("", response_model=list[UserRead])
def list_users(shop_id: int | None = None, role: UserRole | None = None, db: Session = Depends(get_db)):
    return user_service.list_users(db, shop_id=shop_id, role=role)


@router.get("/managers", response_model=list[UserRead])
def list_managers(shop_id: int | None = None, db: Session = Depends(get_db)):
    return user_service.list_users(db, shop_id=shop_id, role=UserRole.MANAGER)


@router.get("/stock-keepers", response_model=list[UserRead])
def list_stock_keepers(shop_id: int | None = None, db: Session = Depends(get_db)):
    return user_service.list_users(db, shop_id=shop_id, role=UserRole.STOCK_KEEPER)


@router.get("/cashiers", response_model=list[UserRead])
def list_cashiers(shop_id: int | None = None, db: Session = Depends(get_db)):
    return user_service.list_users(db, shop_id=shop_id, role=UserRole.CASHIER)


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int, db: Session = Depends(get_db)):
    try:
        return user_service.get_user(db, user_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int, data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    try:
        return user_service.update_user(db, user_id, data, updated_by=current_user)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except PermissionDeniedError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.delete("/{user_id}", response_model=UserRead)
def deactivate_user(
    user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    try:
        return user_service.deactivate_user(db, user_id, deactivated_by=current_user)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except PermissionDeniedError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
