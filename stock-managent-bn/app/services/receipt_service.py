from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import ProductStatus
from app.models.product import Product
from app.models.receipt import Receipt
from app.models.receipt_item import ReceiptItem
from app.schemas.receipt import ReceiptCreate
from app.services.exceptions import InsufficientStockError, NotFoundError


def _generate_receipt_number() -> str:
    return f"RCT-{datetime.now(timezone.utc):%Y%m%d}-{uuid4().hex[:8].upper()}"


def _lock_product(db: Session, *, product_id: int | None, barcode: str | None) -> Product:
    stmt = select(Product).with_for_update()
    if product_id is not None:
        stmt = stmt.where(Product.id == product_id)
    else:
        stmt = stmt.where(Product.barcode == barcode)

    product = db.execute(stmt).scalar_one_or_none()
    if product is None or product.is_deleted:
        raise NotFoundError(f"Product not found (id={product_id}, barcode={barcode})")
    if product.status != ProductStatus.ACTIVE:
        raise NotFoundError(f"Product '{product.sku}' is not active and cannot be checked out")
    return product


def create_receipt(db: Session, data: ReceiptCreate, checked_out_by_id: int) -> Receipt:
    try:
        receipt = Receipt(
            receipt_number=_generate_receipt_number(),
            client_name=data.client_name,
            checked_out_by_id=checked_out_by_id,
        )
        db.add(receipt)

        total = Decimal("0")
        for item in data.items:
            product = _lock_product(db, product_id=item.product_id, barcode=item.barcode)
            if product.quantity_in_stock < item.quantity:
                raise InsufficientStockError(product.sku, product.quantity_in_stock, item.quantity)

            product.quantity_in_stock -= item.quantity
            line_subtotal = product.selling_price * item.quantity
            total += line_subtotal

            db.add(
                ReceiptItem(
                    receipt=receipt,
                    product_id=product.id,
                    quantity=item.quantity,
                    unit_price=product.selling_price,
                    subtotal=line_subtotal,
                )
            )

        receipt.total_amount = total
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(receipt)
    return receipt


def get_receipt(db: Session, receipt_id: int) -> Receipt:
    receipt = db.execute(
        select(Receipt).where(Receipt.id == receipt_id).options(selectinload(Receipt.items))
    ).scalar_one_or_none()
    if receipt is None:
        raise NotFoundError(f"Receipt {receipt_id} not found")
    return receipt


def list_receipts(db: Session, *, skip: int = 0, limit: int = 50) -> list[Receipt]:
    stmt = (
        select(Receipt)
        .options(selectinload(Receipt.items))
        .order_by(Receipt.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(db.execute(stmt).scalars().all())
