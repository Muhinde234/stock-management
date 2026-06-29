from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin
from app.models.enums import PaymentMethod, SaleStatus

if TYPE_CHECKING:
    from app.models.sale_item import SaleItem
    from app.models.user import User


class Sale(Base, TimestampMixin):
    __tablename__ = "sales"
    __table_args__ = (
        CheckConstraint("subtotal >= 0", name="ck_sales_subtotal_non_negative"),
        CheckConstraint("discount_amount >= 0", name="ck_sales_discount_non_negative"),
        CheckConstraint("tax_amount >= 0", name="ck_sales_tax_non_negative"),
        CheckConstraint("grand_total >= 0", name="ck_sales_grand_total_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    sale_number: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    sale_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, server_default="0", nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, server_default="0", nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, server_default="0", nullable=False)
    grand_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, server_default="0", nullable=False)

    payment_method: Mapped[PaymentMethod] = mapped_column(
        SAEnum(PaymentMethod, name="payment_method", native_enum=True, values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    cash_received: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    change_due: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, server_default="0", nullable=False)

    status: Mapped[SaleStatus] = mapped_column(
        SAEnum(SaleStatus, name="sale_status", native_enum=True, values_callable=lambda e: [m.value for m in e]),
        default=SaleStatus.COMPLETED,
        server_default=SaleStatus.COMPLETED.value,
        nullable=False,
    )

    cashier_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)

    client_name: Mapped[str] = mapped_column(String(150), nullable=False)
    client_phone: Mapped[str] = mapped_column(String(32), nullable=False)

    cashier: Mapped["User"] = relationship(back_populates="sales")
    items: Mapped[list["SaleItem"]] = relationship(back_populates="sale", cascade="all, delete-orphan")
