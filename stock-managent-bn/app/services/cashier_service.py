from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import CashierCreate
from app.services.exceptions import ConflictError, NotFoundError


def create_cashier(db: Session, data: CashierCreate) -> User:
    if db.execute(select(User.id).where(User.username == data.username)).first():
        raise ConflictError(f"Username '{data.username}' already exists")
    user = User(**data.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def list_cashiers(db: Session) -> list[User]:
    return list(db.execute(select(User).order_by(User.username)).scalars().all())


def get_cashier(db: Session, cashier_id: int) -> User:
    user = db.get(User, cashier_id)
    if user is None:
        raise NotFoundError(f"Cashier {cashier_id} not found")
    return user
