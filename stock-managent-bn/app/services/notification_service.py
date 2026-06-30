from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import NotificationType
from app.models.notification import Notification
from app.models.product import Product
from app.models.stock import Stock
from app.services.exceptions import NotFoundError


def check_stock_thresholds(db: Session, product: Product, previous_qty: int) -> None:
    """Create a low-stock/out-of-stock alert for the product's stock keeper when its
    quantity crosses a threshold downward. Edge-triggered: only fires the moment it
    crosses, not on every subsequent sale while it stays below the threshold."""
    if product.stock_id is None:
        return

    stock = db.get(Stock, product.stock_id)
    if stock is None or stock.stock_keeper_id is None:
        return

    if product.quantity_in_stock <= 0 and previous_qty > 0:
        db.add(
            Notification(
                user_id=stock.stock_keeper_id,
                product_id=product.id,
                type=NotificationType.OUT_OF_STOCK,
                title="Out of stock",
                message=f"'{product.name}' is now out of stock.",
            )
        )
    elif 0 < product.quantity_in_stock <= product.minimum_stock and previous_qty > product.minimum_stock:
        db.add(
            Notification(
                user_id=stock.stock_keeper_id,
                product_id=product.id,
                type=NotificationType.LOW_STOCK,
                title="Low stock",
                message=(
                    f"'{product.name}' is low on stock: {product.quantity_in_stock} left "
                    f"(minimum {product.minimum_stock})."
                ),
            )
        )


def list_notifications(
    db: Session, user_id: int, *, unread_only: bool = False, skip: int = 0, limit: int = 50
) -> list[Notification]:
    stmt = select(Notification).where(Notification.user_id == user_id).options(selectinload(Notification.product))
    if unread_only:
        stmt = stmt.where(Notification.is_read.is_(False))
    stmt = stmt.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
    return list(db.execute(stmt).scalars().all())


def get_unread_count(db: Session, user_id: int) -> int:
    return db.execute(
        select(func.count()).select_from(
            select(Notification.id)
            .where(Notification.user_id == user_id, Notification.is_read.is_(False))
            .subquery()
        )
    ).scalar_one()


def mark_read(db: Session, notification_id: int, user_id: int) -> Notification:
    notification = db.get(Notification, notification_id)
    if notification is None or notification.user_id != user_id:
        raise NotFoundError(f"Notification {notification_id} not found")
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


def mark_all_read(db: Session, user_id: int) -> None:
    db.execute(
        Notification.__table__.update()
        .where(Notification.user_id == user_id, Notification.is_read.is_(False))
        .values(is_read=True)
    )
    db.commit()
