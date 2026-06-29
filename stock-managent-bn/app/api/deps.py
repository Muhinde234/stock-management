from collections.abc import Generator

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.models.enums import UserRole
from app.models.user import User

bearer_scheme = HTTPBearer()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_access_token(credentials.credentials)
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc

    user = db.get(User, int(payload["sub"]))
    if user is None:
        raise HTTPException(status_code=401, detail="User no longer exists")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="This account has been deactivated")
    return user


def require_roles(*allowed_roles: UserRole):
    """Admin sits at the top of the hierarchy and always passes. Everyone else
    must have a role explicitly listed in allowed_roles."""

    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role == UserRole.ADMIN or user.role in allowed_roles:
            return user
        raise HTTPException(status_code=403, detail="You do not have permission to perform this action")

    return dependency


require_admin_only = require_roles()
require_admin = require_roles(UserRole.MANAGER)
require_stock_keeper = require_roles(UserRole.STOCK_KEEPER, UserRole.MANAGER)
require_cashier = require_roles(UserRole.CASHIER, UserRole.MANAGER)
require_checkout = require_roles(UserRole.STOCK_KEEPER, UserRole.CASHIER, UserRole.MANAGER)
