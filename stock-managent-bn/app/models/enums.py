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
    MANAGER = "manager"
    ADMIN = "admin"
    STOCK_KEEPER = "stock_keeper"
    CASHIER = "cashier"


class StockMovementStatus(str, enum.Enum):
    STOCK_IN = "stock_in"
    STOCK_OUT = "stock_out"


class StockStatus(str, enum.Enum):
    IN_STOCK = "in_stock"
    OUT_OF_STOCK = "out_of_stock"


class PurchaseType(str, enum.Enum):
    PACKAGE = "package"
    DETAIL = "detail"


class NotificationType(str, enum.Enum):
    LOW_STOCK = "low_stock"
    OUT_OF_STOCK = "out_of_stock"
