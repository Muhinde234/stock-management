from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.shop import Shop
from app.schemas.shop import ShopCreate
from app.services.exceptions import ConflictError, NotFoundError


def create_shop(db: Session, data: ShopCreate) -> Shop:
    if db.execute(select(Shop.id).where(Shop.name == data.name)).first():
        raise ConflictError(f"Shop '{data.name}' already exists")
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
