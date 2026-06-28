from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.product import Product
from app.models.purchase_order import PurchaseOrder
from app.schemas.purchase_order import PurchaseOrderCreate
from app.services.exceptions import NotFoundError


def record_purchase_order(db: Session, data: PurchaseOrderCreate, received_by_id: int) -> PurchaseOrder:
    try:
        product = db.execute(
            select(Product).where(Product.id == data.product_id).with_for_update()
        ).scalar_one_or_none()
        if product is None or product.is_deleted:
            raise NotFoundError(f"Product {data.product_id} not found")

        product.quantity_in_stock += data.quantity

        purchase_order = PurchaseOrder(
            purchase_type=data.purchase_type,
            scanned_code=data.scanned_code,
            product_id=product.id,
            quantity=data.quantity,
            quantity_unit=product.quantity_unit,
            unit_price=product.selling_price,
            received_by_id=received_by_id,
        )
        db.add(purchase_order)
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(purchase_order)
    return purchase_order


def list_purchase_orders(
    db: Session, *, product_id: int | None = None, skip: int = 0, limit: int = 50
) -> list[PurchaseOrder]:
    stmt = select(PurchaseOrder).options(selectinload(PurchaseOrder.product))
    if product_id is not None:
        stmt = stmt.where(PurchaseOrder.product_id == product_id)
    stmt = stmt.order_by(PurchaseOrder.created_at.desc()).offset(skip).limit(limit)
    return list(db.execute(stmt).scalars().all())
