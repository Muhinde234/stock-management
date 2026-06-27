from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.stock import Stock
    from app.models.user import User


class Shop(Base, TimestampMixin):
    __tablename__ = "shops"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    manager_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    manager: Mapped[User | None] = relationship()
    stocks: Mapped[list["Stock"]] = relationship(back_populates="shop")
