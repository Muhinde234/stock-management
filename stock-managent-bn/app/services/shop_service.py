from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import UserRole
from app.models.shop import Shop
from app.models.user import User
from app.schemas.shop import ShopCreate, ShopManagerAssign, ShopUpdate
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

    shop = Shop(**data.model_dump())
    db.add(shop)
    db.commit()
    db.refresh(shop)
    return shop


def list_shops(db: Session) -> list[Shop]:
    stmt = select(Shop).where(Shop.is_deleted.is_(False)).order_by(Shop.name)
    return list(db.execute(stmt).scalars().all())


def get_shop(db: Session, shop_id: int) -> Shop:
    shop = db.get(Shop, shop_id)
    if shop is None or shop.is_deleted:
        raise NotFoundError(f"Shop {shop_id} not found")
    return shop


def update_shop(db: Session, shop_id: int, data: ShopUpdate) -> Shop:
    shop = get_shop(db, shop_id)
    updates = data.model_dump(exclude_unset=True)

    if "name" in updates and updates["name"] != shop.name:
        if db.execute(select(Shop.id).where(Shop.name == updates["name"])).first():
            raise ConflictError(f"Shop '{updates['name']}' already exists")

    for field, value in updates.items():
        setattr(shop, field, value)

    db.commit()
    db.refresh(shop)
    return shop


def assign_manager(db: Session, shop_id: int, data: ShopManagerAssign) -> Shop:
    shop = get_shop(db, shop_id)
    _validate_manager(db, data.manager_id)

    if shop.manager_id is not None and shop.manager_id != data.manager_id:
        previous_manager = db.get(User, shop.manager_id)
        if previous_manager is not None:
            previous_manager.shop_id = None

    shop.manager_id = data.manager_id
    if data.manager_id is not None:
        db.get(User, data.manager_id).shop_id = shop.id

    db.commit()
    db.refresh(shop)
    return shop


def delete_shop(db: Session, shop_id: int) -> None:
    shop = get_shop(db, shop_id)
    shop.is_deleted = True
    shop.deleted_at = datetime.now(timezone.utc)
    db.commit()
