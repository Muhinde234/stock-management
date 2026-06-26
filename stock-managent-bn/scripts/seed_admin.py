import argparse

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.enums import UserRole
from app.models.user import User


def seed_admin(email: str, password: str, username: str | None = None) -> None:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).one_or_none()
        if user is None:
            user = User(
                username=username or email.split("@")[0],
                email=email,
                role=UserRole.ADMIN,
            )
            db.add(user)
        user.hashed_password = hash_password(password)
        user.role = UserRole.ADMIN
        db.commit()
        db.refresh(user)
        print(f"Admin ready: id={user.id} username={user.username} email={user.email} role={user.role.value}")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--username", default=None)
    args = parser.parse_args()
    seed_admin(args.email, args.password, args.username)
