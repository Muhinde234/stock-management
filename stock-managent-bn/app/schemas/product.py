from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.models.enums import ProductStatus, StockStatus
from app.schemas.category import CategoryRead
from app.schemas.unit import UnitRead


class ProductBase(BaseModel):
    name: str = Field(alias="productName")
    unit_id: int = Field(alias="quantityUnit")
    selling_price: Decimal = Field(alias="sellingPrice", ge=0)
    minimum_stock: int = Field(alias="minimumQuantity", ge=0)
    buying_price: Decimal | None = Field(default=None, alias="productPrice", ge=0)
    category_id: int
    quantity_in_stock: int = Field(default=0, alias="initialQuantity", ge=0)
    custom_properties: dict[str, str] | None = Field(default=None, alias="additionalProperties")
    expiry_date: date | None = None
    status: ProductStatus = ProductStatus.ACTIVE


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, alias="productName")
    unit_id: int | None = Field(default=None, alias="quantityUnit")
    selling_price: Decimal | None = Field(default=None, alias="sellingPrice", ge=0)
    minimum_stock: int | None = Field(default=None, alias="minimumQuantity", ge=0)
    buying_price: Decimal | None = Field(default=None, alias="productPrice", ge=0)
    category_id: int | None = None
    stock_id: int | None = None
    sku: str | None = None
    barcode: str | None = None
    quantity_in_stock: int | None = Field(default=None, alias="initialQuantity", ge=0)
    custom_properties: dict[str, str] | None = Field(default=None, alias="additionalProperties")
    expiry_date: date | None = None
    status: ProductStatus | None = None


class ProductRead(ProductBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    sku: str
    barcode: str | None
    stock_id: int | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    category: CategoryRead | None = None
    unit: UnitRead | None = None

    @computed_field
    @property
    def stock_status(self) -> StockStatus:
        return StockStatus.OUT_OF_STOCK if self.quantity_in_stock <= 0 else StockStatus.IN_STOCK

    @computed_field
    @property
    def profit_per_unit(self) -> Decimal | None:
        if self.buying_price is None:
            return None
        return self.selling_price - self.buying_price

    @computed_field
    @property
    def profit_margin_percent(self) -> Decimal | None:
        if self.buying_price is None or self.selling_price == 0:
            return None
        return (self.profit_per_unit / self.selling_price * 100).quantize(Decimal("0.01"))
