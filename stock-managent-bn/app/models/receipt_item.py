from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.receipt import Receipt


class ReceiptItem(Base, TimestampMixin):
    __tablename__ = "receipt_items"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_receipt_items_quantity_positive"),
        CheckConstraint("unit_price >= 0", name="ck_receipt_items_unit_price_non_negative"),
        CheckConstraint("subtotal >= 0", name="ck_receipt_items_subtotal_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    receipt_id: Mapped[int] = mapped_column(ForeignKey("receipts.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    quantity: Mapped[int] = mapped_column(nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    receipt: Mapped["Receipt"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship()
