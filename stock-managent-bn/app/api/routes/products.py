from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_stock_keeper
from app.models.enums import ProductStatus, StockStatus
from app.models.user import User
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.services import product_service
from app.services.exceptions import ConflictError, NotFoundError

router = APIRouter(prefix="/products", tags=["products"], dependencies=[Depends(get_current_user)])


@router.post(
    "/register",
    response_model=ProductRead,
    status_code=201,
    summary="Register Product",
    description="Add a product you sell",
    dependencies=[Depends(require_stock_keeper)],
)
def register_product(
    data: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    try:
        return product_service.register_product(db, data, current_user)
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("", response_model=list[ProductRead])
def list_products(
    search: str | None = None,
    category_id: int | None = None,
    stock_id: int | None = None,
    status: ProductStatus | None = None,
    stock_status: StockStatus | None = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    return product_service.list_products(
        db,
        search=search,
        category_id=category_id,
        stock_id=stock_id,
        status=status,
        stock_status=stock_status,
        skip=skip,
        limit=limit,
    )


@router.get("/sku", response_model=ProductRead)
def get_product_by_sku(sku: str, db: Session = Depends(get_db)):
    try:
        return product_service.get_product_by_sku(db, sku)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)):
    try:
        return product_service.get_product(db, product_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/{product_id}", response_model=ProductRead, dependencies=[Depends(require_stock_keeper)])
def update_product(product_id: int, data: ProductUpdate, db: Session = Depends(get_db)):
    try:
        return product_service.update_product(db, product_id, data)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.delete("/{product_id}", status_code=204, dependencies=[Depends(require_stock_keeper)])
def delete_product(product_id: int, db: Session = Depends(get_db)):
    try:
        product_service.soft_delete_product(db, product_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
