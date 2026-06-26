from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Date, ForeignKey, Numeric, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, SoftDeleteMixin, TimestampMixin
from app.models.enums import ProductStatus

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.sale_item import SaleItem


class Product(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("buying_price >= 0", name="ck_products_buying_price_non_negative"),
        CheckConstraint("selling_price >= 0", name="ck_products_selling_price_non_negative"),
        CheckConstraint("quantity_in_stock >= 0", name="ck_products_quantity_non_negative"),
        CheckConstraint("minimum_stock >= 0", name="ck_products_minimum_stock_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    sku: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    barcode: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True, index=True)

    buying_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    selling_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    quantity_in_stock: Mapped[int] = mapped_column(default=0, server_default="0", nullable=False)
    minimum_stock: Mapped[int] = mapped_column(default=0, server_default="0", nullable=False)

    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    status: Mapped[ProductStatus] = mapped_column(
        SAEnum(ProductStatus, name="product_status", native_enum=True, values_callable=lambda e: [m.value for m in e]),
        default=ProductStatus.ACTIVE,
        server_default=ProductStatus.ACTIVE.value,
        nullable=False,
    )

    category: Mapped["Category"] = relationship(back_populates="products")
    sale_items: Mapped[list["SaleItem"]] = relationship(back_populates="product")
