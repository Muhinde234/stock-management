class NotFoundError(Exception):
    pass


class ConflictError(Exception):
    pass


class InsufficientStockError(Exception):
    def __init__(self, sku: str, available: int, requested: int):
        self.sku = sku
        self.available = available
        self.requested = requested
        super().__init__(f"Insufficient stock for SKU {sku}: available={available}, requested={requested}")


class PaymentFailedError(Exception):
    pass


class PermissionDeniedError(Exception):
    pass
