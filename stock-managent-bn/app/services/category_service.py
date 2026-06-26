from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryCreate
from app.services.exceptions import ConflictError, NotFoundError


def create_category(db: Session, data: CategoryCreate) -> Category:
    if db.execute(select(Category.id).where(Category.name == data.name)).first():
        raise ConflictError(f"Category '{data.name}' already exists")
    category = Category(**data.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def list_categories(db: Session) -> list[Category]:
    stmt = select(Category).where(Category.is_deleted.is_(False)).order_by(Category.name)
    return list(db.execute(stmt).scalars().all())


def get_category(db: Session, category_id: int) -> Category:
    category = db.get(Category, category_id)
    if category is None or category.is_deleted:
        raise NotFoundError(f"Category {category_id} not found")
    return category
