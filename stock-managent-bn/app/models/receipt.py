from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.receipt_item import ReceiptItem
    from app.models.user import User


class Receipt(Base, TimestampMixin):
    __tablename__ = "receipts"
    __table_args__ = (CheckConstraint("total_amount >= 0", name="ck_receipts_total_amount_non_negative"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    receipt_number: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    client_name: Mapped[str] = mapped_column(String(150), nullable=False)
    client_phone: Mapped[str] = mapped_column(String(32), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, server_default="0", nullable=False)

    checked_out_by_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    checked_out_by: Mapped["User"] = relationship()
    items: Mapped[list["ReceiptItem"]] = relationship(back_populates="receipt", cascade="all, delete-orphan")
