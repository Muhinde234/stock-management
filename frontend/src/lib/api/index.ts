export { api, getToken, setToken, removeToken, ApiError } from "./client";
export type { } from "./client";

export { authApi } from "./auth";
export type { LoginPayload, AuthResponse } from "./auth";


export { dashboardApi } from "./dashboard";
export type {
  DashboardStats, SalesOverviewItem, TopProduct,
  RecentTransaction, StockAlert,
} from "./dashboard";

export { categoriesApi } from "./categories";
export type { Category } from "./categories";

export { productsApi, parsePrice } from "./products";
export type { Product, ProductPayload, GetProductsParams } from "./products";

export { salesApi, getCashierIdFromToken } from "./sales";
export type { SaleCreate, SaleRead, SaleItemCreate, PaymentMethod } from "./sales";

export { inventoryApi } from "./inventory";
export type {
  StockMovement, StockMovementsResponse,
  StockInPayload, StockAdjustPayload, TransferPayload,
} from "./inventory";

export { customersApi } from "./customers";
export type { Customer, CustomersResponse, CustomerPayload } from "./customers";

export { suppliersApi } from "./suppliers";
export type {
  Supplier, SuppliersResponse, SupplierPayload, PurchaseOrder,
} from "./suppliers";

export { expensesApi } from "./expenses";
export type { Expense, ExpensesResponse, ExpensePayload } from "./expenses";

export { reportsApi } from "./reports";
export type {
  ProfitLossReport, SalesTrendItem, StockValuationItem, ReportParams,
} from "./reports";
