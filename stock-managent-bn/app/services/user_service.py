from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate
from app.services.exceptions import ConflictError, NotFoundError


def create_user(db: Session, data: UserCreate) -> User:
    if db.execute(select(User.id).where(User.email == data.email)).first():
        raise ConflictError(f"Email '{data.email}' already exists")

    username = data.email.split("@")[0]
    if db.execute(select(User.id).where(User.username == username)).first():
        raise ConflictError(f"Username '{username}' already exists")

    user = User(
        username=username,
        email=data.email,
        full_name=data.full_name,
        role=data.role,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def list_users(db: Session) -> list[User]:
    return list(db.execute(select(User).order_by(User.username)).scalars().all())


def get_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise NotFoundError(f"User {user_id} not found")
    return user
