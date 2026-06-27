from datetime import datetime, timezone

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.enums import ProductStatus, StockStatus
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from app.services.exceptions import ConflictError, NotFoundError


def create_product(db: Session, data: ProductCreate) -> Product:
    if db.execute(select(Product.id).where(Product.sku == data.sku)).first():
        raise ConflictError(f"SKU '{data.sku}' already exists")
    if db.execute(select(Product.id).where(Product.barcode == data.barcode)).first():
        raise ConflictError(f"Barcode '{data.barcode}' already exists")

    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def get_product(db: Session, product_id: int) -> Product:
    product = db.get(Product, product_id)
    if product is None or product.is_deleted:
        raise NotFoundError(f"Product {product_id} not found")
    return product


def get_product_by_barcode(db: Session, barcode: str) -> Product:
    product = db.execute(
        select(Product).where(Product.barcode == barcode, Product.is_deleted.is_(False))
    ).scalar_one_or_none()
    if product is None:
        raise NotFoundError(f"Product with barcode '{barcode}' not found")
    return product


def list_products(
    db: Session,
    *,
    search: str | None = None,
    category_id: int | None = None,
    status: ProductStatus | None = None,
    stock_status: StockStatus | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Product]:
    stmt = select(Product).where(Product.is_deleted.is_(False))

    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            or_(Product.name.ilike(pattern), Product.sku.ilike(pattern), Product.barcode.ilike(pattern))
        )
    if category_id is not None:
        stmt = stmt.where(Product.category_id == category_id)
    if status is not None:
        stmt = stmt.where(Product.status == status)
    if stock_status == StockStatus.OUT_OF_STOCK:
        stmt = stmt.where(Product.quantity_in_stock <= 0)
    elif stock_status == StockStatus.IN_STOCK:
        stmt = stmt.where(Product.quantity_in_stock > 0)

    stmt = stmt.order_by(Product.name).offset(skip).limit(limit)
    return list(db.execute(stmt).scalars().all())


def update_product(db: Session, product_id: int, data: ProductUpdate) -> Product:
    product = get_product(db, product_id)
    updates = data.model_dump(exclude_unset=True)

    if "sku" in updates and updates["sku"] != product.sku:
        if db.execute(select(Product.id).where(Product.sku == updates["sku"])).first():
            raise ConflictError(f"SKU '{updates['sku']}' already exists")
    if "barcode" in updates and updates["barcode"] != product.barcode and updates["barcode"] is not None:
        if db.execute(select(Product.id).where(Product.barcode == updates["barcode"])).first():
            raise ConflictError(f"Barcode '{updates['barcode']}' already exists")

    for field, value in updates.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


def soft_delete_product(db: Session, product_id: int) -> None:
    product = get_product(db, product_id)
    product.is_deleted = True
    product.deleted_at = datetime.now(timezone.utc)
    product.status = ProductStatus.INACTIVE
    db.commit()
