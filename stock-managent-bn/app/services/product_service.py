from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.enums import ProductStatus, StockStatus
from app.models.product import Product
from app.models.unit import Unit
from app.schemas.product import ProductCreate, ProductUpdate
from app.services.exceptions import ConflictError, NotFoundError


def _generate_sku() -> str:
    return f"SKU-{uuid4().hex[:10].upper()}"


def register_product(db: Session, data: ProductCreate) -> Product:
    if db.get(Category, data.category_id) is None:
        raise NotFoundError(f"Category {data.category_id} not found")
    if db.get(Unit, data.unit_id) is None:
        raise NotFoundError(f"Unit {data.unit_id} not found")

    sku = _generate_sku()
    if db.execute(select(Product.id).where(Product.sku == sku)).first():
        raise ConflictError(f"SKU '{sku}' already exists")

    product = Product(**data.model_dump(), sku=sku)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def get_product(db: Session, product_id: int) -> Product:
    product = db.get(Product, product_id)
    if product is None or product.is_deleted:
        raise NotFoundError(f"Product {product_id} not found")
    return product


def get_product_by_sku(db: Session, sku: str) -> Product:
    product = db.execute(
        select(Product).where(Product.sku == sku, Product.is_deleted.is_(False))
    ).scalar_one_or_none()
    if product is None:
        raise NotFoundError(f"Product with SKU '{sku}' not found")
    return product


def list_products(
    db: Session,
    *,
    search: str | None = None,
    category_id: int | None = None,
    stock_id: int | None = None,
    status: ProductStatus | None = None,
    stock_status: StockStatus | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Product]:
    stmt = select(Product).where(Product.is_deleted.is_(False))

    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(or_(Product.name.ilike(pattern), Product.sku.ilike(pattern)))
    if category_id is not None:
        stmt = stmt.where(Product.category_id == category_id)
    if stock_id is not None:
        stmt = stmt.where(Product.stock_id == stock_id)
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
