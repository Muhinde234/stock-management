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

export { productsApi, parsePrice, getUnitName } from "./products";
export type { Product, ProductPayload, GetProductsParams, StockStatus } from "./products";

export { unitsApi } from "./units";
export type { Unit } from "./units";

export { salesApi, getCashierIdFromToken } from "./sales";
export type { SaleCreate, SaleRead, SaleItemCreate, PaymentMethod, SaleStatus } from "./sales";

export { inventoryApi } from "./inventory";
export type { StockMovementRead, StockMovementCreate, StockMovementStatus } from "./inventory";

export { cashiersApi } from "./cashiers";
export type { Cashier, CashierCreate } from "./cashiers";

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

export { shopsApi } from "./shops";
export type { Shop, ShopCreate } from "./shops";

export { shopManagersApi } from "./shop-managers";
export type { ShopManager, ShopManagerCreate, ShopManagerUpdate } from "./shop-managers";

export { usersApi } from "./users";
export type { AppUser, UserCreate, UserUpdate, AppRole } from "./users";

export { storesApi } from "./stores";
export type { Store, StoreCreate, StoreUpdate } from "./stores";

export { stockKeepersApi } from "./stock-keepers";
export type { StockKeeper, StockKeeperCreate, StockKeeperUpdate } from "./stock-keepers";

export { purchasesApi } from "./purchases";
export type { Purchase, PurchaseCreate } from "./purchases";
