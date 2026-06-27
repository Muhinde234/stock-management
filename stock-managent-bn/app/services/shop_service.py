from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import UserRole
from app.models.shop import Shop
from app.models.user import User
from app.schemas.shop import ShopCreate, ShopUpdate
from app.services.exceptions import ConflictError, NotFoundError


def _validate_manager(db: Session, manager_id: int | None) -> None:
    if manager_id is None:
        return
    manager = db.get(User, manager_id)
    if manager is None or manager.role != UserRole.MANAGER:
        raise ConflictError(f"User {manager_id} is not a manager")


def create_shop(db: Session, data: ShopCreate) -> Shop:
    if db.execute(select(Shop.id).where(Shop.name == data.name)).first():
        raise ConflictError(f"Shop '{data.name}' already exists")
    _validate_manager(db, data.manager_id)

    shop = Shop(**data.model_dump())
    db.add(shop)
    db.commit()
    db.refresh(shop)
    return shop


def list_shops(db: Session) -> list[Shop]:
    return list(db.execute(select(Shop).order_by(Shop.name)).scalars().all())


def get_shop(db: Session, shop_id: int) -> Shop:
    shop = db.get(Shop, shop_id)
    if shop is None:
        raise NotFoundError(f"Shop {shop_id} not found")
    return shop


def assign_manager(db: Session, shop_id: int, data: ShopUpdate) -> Shop:
    shop = get_shop(db, shop_id)
    _validate_manager(db, data.manager_id)
    shop.manager_id = data.manager_id
    db.commit()
    db.refresh(shop)
    return shop
