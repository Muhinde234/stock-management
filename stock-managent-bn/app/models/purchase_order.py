from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin
from app.models.enums import PurchaseType

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.user import User


class PurchaseOrder(Base, TimestampMixin):
    __tablename__ = "purchase_orders"
    __table_args__ = (CheckConstraint("quantity > 0", name="ck_purchase_orders_quantity_positive"),)

    id: Mapped[int] = mapped_column(primary_key=True)

    purchase_type: Mapped[PurchaseType] = mapped_column(
        SAEnum(PurchaseType, name="purchase_type", native_enum=True, values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    scanned_code: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    quantity: Mapped[int] = mapped_column(nullable=False)
    quantity_unit: Mapped[str] = mapped_column(String(32), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    received_by_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    supplier_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    supplier_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)

    product: Mapped["Product"] = relationship()
    received_by: Mapped["User"] = relationship()
