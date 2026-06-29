from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.shop import Shop
    from app.models.user import User


class Stock(Base, TimestampMixin):
    __tablename__ = "stocks"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)

    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id", ondelete="RESTRICT"), nullable=False, index=True)
    stock_keeper_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=True, index=True
    )
    cashier_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=True, index=True
    )

    shop: Mapped["Shop"] = relationship(back_populates="stocks")
    stock_keeper: Mapped["User | None"] = relationship(foreign_keys=[stock_keeper_id])
    cashier: Mapped[User | None] = relationship(foreign_keys=[cashier_id])
