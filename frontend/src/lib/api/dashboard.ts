import { api } from "./client";

export interface DashboardStats {
  totalRevenue: number;
  totalPurchases: number;
  salesReturn: number;
  totalProfit: number;
  totalProducts: number;
  totalCustomers: number;
  totalSuppliers: number;
  totalWarehouses: number;
  lowStockItems: number;
  outOfStock: number;
  revenueChange: number;
  purchasesChange: number;
  returnChange: number;
  profitChange: number;
}

export interface SalesOverviewItem {
  day: string;
  sales: number;
  purchases: number;
}

export interface TopProduct {
  name: string;
  sales: number;
  percentage: number;
}

export interface RecentTransaction {
  id: string;
  type: "sale" | "purchase" | "transfer";
  label: string;
  ref: string;
  amount: number;
  time: string;
}

export interface StockAlert {
  product: string;
  sku: string;
  warehouse: string;
  stock: number;
  level: "Low Stock" | "Critical";
}

export const dashboardApi = {
  getStats() {
    return api.get<DashboardStats>("/api/dashboard/stats");
  },

  getSalesOverview(period: "week" | "month" = "week") {
    return api.get<SalesOverviewItem[]>(`/api/dashboard/sales-overview?period=${period}`);
  },

  getTopProducts() {
    return api.get<TopProduct[]>("/api/dashboard/top-products");
  },

  getRecentTransactions() {
    return api.get<RecentTransaction[]>("/api/dashboard/recent-transactions");
  },

  getStockAlerts() {
    return api.get<StockAlert[]>("/api/dashboard/stock-alerts");
  },
};
