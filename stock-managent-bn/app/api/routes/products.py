from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.enums import ProductStatus
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.services import product_service
from app.services.exceptions import ConflictError, NotFoundError

router = APIRouter(prefix="/products", tags=["products"])

UPLOAD_DIR = Path("static/uploads")
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("", response_model=ProductRead, status_code=201)
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    try:
        return product_service.create_product(db, data)
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("", response_model=list[ProductRead])
def list_products(
    search: str | None = None,
    category_id: int | None = None,
    status: ProductStatus | None = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    return product_service.list_products(
        db, search=search, category_id=category_id, status=status, skip=skip, limit=limit
    )


@router.get("/barcode/{barcode}", response_model=ProductRead)
def get_product_by_barcode(barcode: str, db: Session = Depends(get_db)):
    try:
        return product_service.get_product_by_barcode(db, barcode)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)):
    try:
        return product_service.get_product(db, product_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/{product_id}", response_model=ProductRead)
def update_product(product_id: int, data: ProductUpdate, db: Session = Depends(get_db)):
    try:
        return product_service.update_product(db, product_id, data)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    try:
        product_service.soft_delete_product(db, product_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{product_id}/image", response_model=ProductRead)
def upload_product_image(product_id: int, file: UploadFile, db: Session = Depends(get_db)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported image type")

    try:
        product_service.get_product(db, product_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    extension = Path(file.filename or "").suffix
    filename = f"{uuid4().hex}{extension}"
    destination = UPLOAD_DIR / filename
    with destination.open("wb") as buffer:
        buffer.write(file.file.read())

    return product_service.set_product_image(db, product_id, f"/static/uploads/{filename}")
