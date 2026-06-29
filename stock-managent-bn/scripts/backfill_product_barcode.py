from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.product import Product
from app.models.purchase_order import PurchaseOrder


def backfill_product_barcode() -> None:
    db = SessionLocal()
    try:
        products = db.execute(select(Product).where(Product.barcode.is_(None))).scalars().all()
        updated = 0
        skipped = 0

        for product in products:
            earliest_po = db.execute(
                select(PurchaseOrder)
                .where(PurchaseOrder.product_id == product.id)
                .order_by(PurchaseOrder.created_at.asc())
            ).scalars().first()

            if earliest_po is None:
                continue

            conflict = db.execute(
                select(Product.id).where(Product.barcode == earliest_po.scanned_code)
            ).scalar_one_or_none()
            if conflict is not None:
                print(f"Skipping product {product.id} ({product.name}): "
                      f"barcode '{earliest_po.scanned_code}' already used by product {conflict}")
                skipped += 1
                continue

            product.barcode = earliest_po.scanned_code
            updated += 1
            print(f"Product {product.id} ({product.name}): barcode set to '{earliest_po.scanned_code}'")

        db.commit()
        print(f"\nDone. Updated {updated}, skipped {skipped} (conflicts).")
    finally:
        db.close()


if __name__ == "__main__":
    backfill_product_barcode()
