from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import UserRole
from app.models.product import Product
from app.models.shop import Shop
from app.models.stock import Stock
from app.models.user import User
from app.schemas.stock import StockCreate, StockUpdate
from app.services.exceptions import ConflictError, NotFoundError, PermissionDeniedError


def _check_manager_owns_stock(stock: Stock, current_user: User) -> None:
    if current_user.role == UserRole.MANAGER and stock.shop.manager_id != current_user.id:
        raise PermissionDeniedError("You can only manage stocks for the shop you manage")


def create_stock(db: Session, data: StockCreate, current_user: User) -> Stock:
    shop = db.get(Shop, data.shop_id)
    if shop is None:
        raise NotFoundError(f"Shop {data.shop_id} not found")

    if current_user.role == UserRole.MANAGER and shop.manager_id != current_user.id:
        raise PermissionDeniedError("You can only create stocks for the shop you manage")

    stock = Stock(name=data.name, shop_id=data.shop_id)
    db.add(stock)
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


def update_stock(db: Session, stock_id: int, data: StockUpdate, current_user: User) -> Stock:
    stock = get_stock(db, stock_id)
    _check_manager_owns_stock(stock, current_user)

    updates = data.model_dump(exclude_unset=True)

    if "stock_keeper_id" in updates and updates["stock_keeper_id"] is not None:
        stock_keeper = db.get(User, updates["stock_keeper_id"])
        if stock_keeper is None or stock_keeper.role != UserRole.STOCK_KEEPER:
            raise ConflictError(f"User {updates['stock_keeper_id']} is not a stock keeper")
        stock_keeper.shop_id = stock.shop_id

    if "cashier_id" in updates and updates["cashier_id"] is not None:
        cashier = db.get(User, updates["cashier_id"])
        if cashier is None or cashier.role != UserRole.CASHIER:
            raise ConflictError(f"User {updates['cashier_id']} is not a cashier")
        cashier.shop_id = stock.shop_id

    for field, value in updates.items():
        setattr(stock, field, value)

    db.commit()
    db.refresh(stock)
    return stock


def delete_stock(db: Session, stock_id: int, current_user: User) -> None:
    stock = get_stock(db, stock_id)
    _check_manager_owns_stock(stock, current_user)

    if db.execute(select(Product.id).where(Product.stock_id == stock_id)).first():
        raise ConflictError(f"Cannot delete stock {stock_id}: it still has products registered under it")

    db.delete(stock)
    db.commit()
