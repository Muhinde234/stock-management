from decimal import Decimal

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_products: int
    low_stock_count: int
    out_of_stock_count: int
    today_check_ins: int
    today_check_outs: int
    today_checkout_total: Decimal
