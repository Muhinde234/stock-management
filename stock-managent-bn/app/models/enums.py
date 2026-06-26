import enum


class ProductStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    CARD = "card"
    MOBILE_MONEY = "mobile_money"
    OTHER = "other"


class SaleStatus(str, enum.Enum):
    COMPLETED = "completed"
    VOIDED = "voided"
    REFUNDED = "refunded"


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    CASHIER = "cashier"


class StockMovementStatus(str, enum.Enum):
    STOCK_IN = "stock_in"
    STOCK_OUT = "stock_out"


class StockStatus(str, enum.Enum):
    IN_STOCK = "in_stock"
    OUT_OF_STOCK = "out_of_stock"
