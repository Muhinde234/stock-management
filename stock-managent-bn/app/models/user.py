from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.sale import Sale


class User(Base, TimestampMixin):
    """Minimal cashier identity placeholder, pending a dedicated Auth/Staff module."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    full_name: Mapped[str | None] = mapped_column(String(150), nullable=True)

    sales: Mapped[list["Sale"]] = relationship(back_populates="cashier")
