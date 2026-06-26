from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.models.user import User


class InvalidCredentialsError(Exception):
    pass


def authenticate(db: Session, email: str, password: str) -> str:
    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if user is None or not user.hashed_password:
        raise InvalidCredentialsError("Invalid email or password")
    if not verify_password(password, user.hashed_password):
        raise InvalidCredentialsError("Invalid email or password")

    return create_access_token(subject=str(user.id), role=user.role.value)
