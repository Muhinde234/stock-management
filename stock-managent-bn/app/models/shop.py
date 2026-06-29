from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, SoftDeleteMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.stock import Stock
    from app.models.user import User


class Shop(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "shops"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    address: Mapped[str] = mapped_column(String(255), nullable=False, server_default="")
    phone: Mapped[str] = mapped_column(String(32), nullable=False, server_default="")
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    manager_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    manager: Mapped[User | None] = relationship(foreign_keys=[manager_id])
    stocks: Mapped[list["Stock"]] = relationship(back_populates="shop")
