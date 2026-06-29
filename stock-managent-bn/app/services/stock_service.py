from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import UserRole
from app.models.shop import Shop
from app.models.stock import Stock
from app.models.user import User
from app.schemas.stock import StockCreate
from app.services.exceptions import ConflictError, NotFoundError, PermissionDeniedError


def create_stock(db: Session, data: StockCreate, current_user: User) -> Stock:
    shop = db.get(Shop, data.shop_id)
    if shop is None:
        raise NotFoundError(f"Shop {data.shop_id} not found")

    if current_user.role == UserRole.MANAGER and shop.manager_id != current_user.id:
        raise PermissionDeniedError("You can only create stocks for the shop you manage")

    stock_keeper = db.get(User, data.stock_keeper_id)
    if stock_keeper is None or stock_keeper.role != UserRole.STOCK_KEEPER:
        raise ConflictError(f"User {data.stock_keeper_id} is not a stock keeper")

    cashier = None
    if data.cashier_id is not None:
        cashier = db.get(User, data.cashier_id)
        if cashier is None or cashier.role != UserRole.CASHIER:
            raise ConflictError(f"User {data.cashier_id} is not a cashier")

    stock = Stock(**data.model_dump())
    db.add(stock)

    stock_keeper.shop_id = shop.id
    if cashier is not None:
        cashier.shop_id = shop.id

    db.commit()
    db.refresh(stock)
    return stock


def list_stocks(db: Session, *, shop_id: int | None = None) -> list[Stock]:
    stmt = select(Stock)
    if shop_id is not None:
        stmt = stmt.where(Stock.shop_id == shop_id)
    return list(db.execute(stmt.order_by(Stock.name)).scalars().all())


def get_stock(db: Session, stock_id: int) -> Stock:
    stock = db.get(Stock, stock_id)
    if stock is None:
        raise NotFoundError(f"Stock {stock_id} not found")
    return stock
