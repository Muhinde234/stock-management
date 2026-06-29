from app.db.session import SessionLocal
from app.models.category import Category
from app.models.unit import Unit

DEFAULT_UNITS = ["pcs", "kg", "g", "litre", "ml", "box", "pack", "carton", "dozen"]

DEFAULT_CATEGORIES = [
    "Beverages",
    "Groceries",
    "Dairy",
    "Bakery",
    "Household",
    "Personal Care",
    "Electronics",
    "Stationery",
]


def seed_catalog() -> None:
    db = SessionLocal()
    try:
        existing_units = {name for (name,) in db.query(Unit.name).all()}
        for name in DEFAULT_UNITS:
            if name not in existing_units:
                db.add(Unit(name=name))

        existing_categories = {name for (name,) in db.query(Category.name).all()}
        for name in DEFAULT_CATEGORIES:
            if name not in existing_categories:
                db.add(Category(name=name))

        db.commit()
        print(f"Seeded units: {DEFAULT_UNITS}")
        print(f"Seeded categories: {DEFAULT_CATEGORIES}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_catalog()
