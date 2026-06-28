from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import PaymentMethod, ProductStatus, SaleStatus
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.schemas.sale import SaleCreate
from app.services.exceptions import InsufficientStockError, NotFoundError, PaymentFailedError


def _generate_sale_number() -> str:
    return f"SALE-{datetime.now(timezone.utc):%Y%m%d}-{uuid4().hex[:8].upper()}"


def _lock_product(db: Session, *, product_id: int | None, sku: str | None) -> Product:
    stmt = select(Product).with_for_update()
    if product_id is not None:
        stmt = stmt.where(Product.id == product_id)
    else:
        stmt = stmt.where(Product.sku == sku)

    product = db.execute(stmt).scalar_one_or_none()
    if product is None or product.is_deleted:
        raise NotFoundError(f"Product not found (id={product_id}, sku={sku})")
    if product.status != ProductStatus.ACTIVE:
        raise PaymentFailedError(f"Product '{product.sku}' is not active and cannot be sold")
    return product


def complete_sale(db: Session, data: SaleCreate, cashier_id: int) -> Sale:
    try:
        sale = Sale(
            sale_number=_generate_sale_number(),
            cashier_id=cashier_id,
            payment_method=data.payment_method,
            discount_amount=data.discount_amount,
            tax_amount=data.tax_amount,
        )
        db.add(sale)

        subtotal = Decimal("0")
        for item in data.items:
            product = _lock_product(db, product_id=item.product_id, sku=item.sku)
            if product.quantity_in_stock < item.quantity:
                raise InsufficientStockError(product.sku, product.quantity_in_stock, item.quantity)

            product.quantity_in_stock -= item.quantity
            line_subtotal = product.selling_price * item.quantity
            subtotal += line_subtotal

            db.add(
                SaleItem(
                    sale=sale,
                    product_id=product.id,
                    quantity=item.quantity,
                    unit_price=product.selling_price,
                    subtotal=line_subtotal,
                )
            )

        if data.discount_amount > subtotal:
            raise PaymentFailedError("Discount cannot exceed subtotal")

        grand_total = subtotal - data.discount_amount + data.tax_amount

        if data.payment_method == PaymentMethod.CASH:
            if data.cash_received is None or data.cash_received < grand_total:
                raise PaymentFailedError("Cash received is insufficient to cover the grand total")
            sale.change_due = data.cash_received - grand_total
        else:
            sale.change_due = Decimal("0")

        sale.subtotal = subtotal
        sale.grand_total = grand_total
        sale.cash_received = data.cash_received

        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(sale)
    return sale


def get_sale(db: Session, sale_id: int) -> Sale:
    sale = db.execute(
        select(Sale).where(Sale.id == sale_id).options(selectinload(Sale.items))
    ).scalar_one_or_none()
    if sale is None:
        raise NotFoundError(f"Sale {sale_id} not found")
    return sale


def list_sales(db: Session, *, skip: int = 0, limit: int = 50) -> list[Sale]:
    stmt = (
        select(Sale)
        .options(selectinload(Sale.items))
        .order_by(Sale.sale_date.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(db.execute(stmt).scalars().all())


def void_sale(db: Session, sale_id: int) -> Sale:
    try:
        sale = db.execute(
            select(Sale).where(Sale.id == sale_id).options(selectinload(Sale.items)).with_for_update()
        ).scalar_one_or_none()
        if sale is None:
            raise NotFoundError(f"Sale {sale_id} not found")
        if sale.status != SaleStatus.COMPLETED:
            raise PaymentFailedError(f"Sale {sale_id} cannot be voided from status '{sale.status.value}'")

        for item in sale.items:
            product = db.execute(
                select(Product).where(Product.id == item.product_id).with_for_update()
            ).scalar_one_or_none()
            if product is not None:
                product.quantity_in_stock += item.quantity

        sale.status = SaleStatus.VOIDED
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(sale)
    return sale
