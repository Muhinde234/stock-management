from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import StockMovementStatus
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.schemas.stock_movement import StockMovementCreate
from app.services.exceptions import ConflictError, InsufficientStockError, NotFoundError


def record_movement(db: Session, data: StockMovementCreate, performed_by_id: int) -> StockMovement:
    try:
        product = db.execute(
            select(Product).where(or_(Product.sku == data.sku, Product.barcode == data.sku)).with_for_update()
        ).scalar_one_or_none()
        if product is None or product.is_deleted:
            raise NotFoundError(f"Product with SKU/barcode '{data.sku}' not found")

        if data.status == StockMovementStatus.STOCK_OUT:
            if product.quantity_in_stock < data.quantity:
                raise InsufficientStockError(product.sku, product.quantity_in_stock, data.quantity)
            product.quantity_in_stock -= data.quantity
        else:
            product.quantity_in_stock += data.quantity

        movement = StockMovement(
            product_id=product.id,
            status=data.status,
            quantity=data.quantity,
            performed_by_id=performed_by_id,
        )
        db.add(movement)
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(movement)
    return movement


def list_movements(db: Session, *, product_id: int | None = None, skip: int = 0, limit: int = 50) -> list[StockMovement]:
    stmt = select(StockMovement).options(selectinload(StockMovement.product))
    if product_id is not None:
        stmt = stmt.where(StockMovement.product_id == product_id)
    stmt = stmt.order_by(StockMovement.created_at.desc()).offset(skip).limit(limit)
    return list(db.execute(stmt).scalars().all())


def get_movement(db: Session, movement_id: int) -> StockMovement:
    movement = db.execute(
        select(StockMovement).where(StockMovement.id == movement_id).options(selectinload(StockMovement.product))
    ).scalar_one_or_none()
    if movement is None:
        raise NotFoundError(f"Stock movement {movement_id} not found")
    return movement


def delete_movement(db: Session, movement_id: int) -> None:
    try:
        movement = db.get(StockMovement, movement_id)
        if movement is None:
            raise NotFoundError(f"Stock movement {movement_id} not found")

        product = db.execute(
            select(Product).where(Product.id == movement.product_id).with_for_update()
        ).scalar_one_or_none()
        if product is not None:
            if movement.status == StockMovementStatus.STOCK_IN:
                if product.quantity_in_stock < movement.quantity:
                    raise ConflictError(
                        f"Cannot delete stock movement {movement_id}: product stock "
                        f"({product.quantity_in_stock}) is lower than the quantity it added "
                        f"({movement.quantity}), some of it has already been moved out"
                    )
                product.quantity_in_stock -= movement.quantity
            else:
                product.quantity_in_stock += movement.quantity

        db.delete(movement)
        db.commit()
    except Exception:
        db.rollback()
        raise
