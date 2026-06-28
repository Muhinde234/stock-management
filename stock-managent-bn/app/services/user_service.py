from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.enums import UserRole
from app.models.shop import Shop
from app.models.user import User
from app.schemas.user import UserCreate
from app.services.exceptions import ConflictError, NotFoundError, PermissionDeniedError

MANAGER_CREATABLE_ROLES = {UserRole.STOCK_KEEPER, UserRole.CASHIER}


def create_user(db: Session, data: UserCreate, created_by: User) -> User:
    if created_by.role == UserRole.MANAGER and data.role not in MANAGER_CREATABLE_ROLES:
        raise PermissionDeniedError(
            f"A manager can only create stock keeper or cashier accounts, not '{data.role.value}'"
        )

    if data.shop_id is not None and data.role != UserRole.MANAGER:
        raise ConflictError("shop_id can only be assigned when creating a manager")

    try:
        if db.execute(select(User.id).where(User.email == data.email)).first():
            raise ConflictError(f"Email '{data.email}' already exists")

        username = data.email.split("@")[0]
        if db.execute(select(User.id).where(User.username == username)).first():
            raise ConflictError(f"Username '{username}' already exists")

        shop = None
        if data.shop_id is not None:
            shop = db.get(Shop, data.shop_id)
            if shop is None or shop.is_deleted:
                raise NotFoundError(f"Shop {data.shop_id} not found")

        user = User(
            username=username,
            email=data.email,
            full_name=data.full_name,
            role=data.role,
            hashed_password=hash_password(data.password),
        )
        db.add(user)
        db.flush()

        if shop is not None:
            shop.manager_id = user.id

        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(user)
    user.shop_id = shop.id if shop is not None else None
    return user


def list_users(db: Session) -> list[User]:
    return list(db.execute(select(User).order_by(User.username)).scalars().all())


def get_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise NotFoundError(f"User {user_id} not found")
    return user
