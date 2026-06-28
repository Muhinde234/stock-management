from datetime import datetime, time, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.purchase_order import PurchaseOrder
from app.models.receipt import Receipt
from app.schemas.dashboard import DashboardStats


def get_dashboard_stats(db: Session, *, stock_id: int | None = None) -> DashboardStats:
    today_start = datetime.combine(datetime.now(timezone.utc).date(), time.min, tzinfo=timezone.utc)

    product_stmt = select(Product).where(Product.is_deleted.is_(False))
    if stock_id is not None:
        product_stmt = product_stmt.where(Product.stock_id == stock_id)

    total_products = db.execute(
        select(func.count()).select_from(product_stmt.subquery())
    ).scalar_one()

    low_stock_stmt = product_stmt.where(
        Product.quantity_in_stock > 0, Product.quantity_in_stock <= Product.minimum_stock
    )
    low_stock_count = db.execute(select(func.count()).select_from(low_stock_stmt.subquery())).scalar_one()

    out_of_stock_stmt = product_stmt.where(Product.quantity_in_stock <= 0)
    out_of_stock_count = db.execute(select(func.count()).select_from(out_of_stock_stmt.subquery())).scalar_one()

    check_in_stmt = select(func.count()).where(PurchaseOrder.created_at >= today_start)
    if stock_id is not None:
        check_in_stmt = check_in_stmt.join(Product, Product.id == PurchaseOrder.product_id).where(
            Product.stock_id == stock_id
        )
    today_check_ins = db.execute(check_in_stmt).scalar_one()

    check_out_stmt = select(func.count(), func.coalesce(func.sum(Receipt.total_amount), 0)).where(
        Receipt.created_at >= today_start
    )
    today_check_outs, today_checkout_total = db.execute(check_out_stmt).one()

    return DashboardStats(
        total_products=total_products,
        low_stock_count=low_stock_count,
        out_of_stock_count=out_of_stock_count,
        today_check_ins=today_check_ins,
        today_check_outs=today_check_outs,
        today_checkout_total=Decimal(today_checkout_total),
    )
