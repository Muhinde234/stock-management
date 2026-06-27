from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.models.enums import ProductStatus, StockStatus
from app.schemas.category import CategoryRead


class ProductBase(BaseModel):
    name: str = Field(alias="productName")
    quantity_unit: str = Field(alias="quantityUnit")
    selling_price: Decimal = Field(alias="productPrice", ge=0)
    description: str | None = None
    category_id: int
    buying_price: Decimal | None = Field(default=None, ge=0)
    quantity_in_stock: int = Field(default=0, ge=0)
    minimum_stock: int = Field(default=0, ge=0)
    expiry_date: date | None = None
    status: ProductStatus = ProductStatus.ACTIVE


class ProductCreate(ProductBase):
    sku: str | None = None
    barcode: str | None = None


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, alias="productName")
    quantity_unit: str | None = Field(default=None, alias="quantityUnit")
    selling_price: Decimal | None = Field(default=None, alias="productPrice", ge=0)
    description: str | None = None
    category_id: int | None = None
    sku: str | None = None
    barcode: str | None = None
    buying_price: Decimal | None = Field(default=None, ge=0)
    quantity_in_stock: int | None = Field(default=None, ge=0)
    minimum_stock: int | None = Field(default=None, ge=0)
    expiry_date: date | None = None
    status: ProductStatus | None = None


class ProductRead(ProductBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    sku: str
    barcode: str | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    category: CategoryRead | None = None

    @computed_field
    @property
    def stock_status(self) -> StockStatus:
        return StockStatus.OUT_OF_STOCK if self.quantity_in_stock <= 0 else StockStatus.IN_STOCK
