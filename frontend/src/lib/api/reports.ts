import { api } from "./client";

export interface ReportParams {
  from: string;
  to: string;
  category?: string;
  status?: string;
  warehouse?: string;
}

export interface ProfitLossReport {
  revenue: number;
  costOfGoods: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  profitMargin: number;
  period: { from: string; to: string };
}

export interface SalesTrendItem {
  date: string;
  sales: number;
  transactions: number;
}

export interface StockValuationItem {
  productId: string;
  name: string;
  sku: string;
  stock: number;
  buyingPrice: number;
  sellingPrice: number;
  stockValue: number;
  potentialRevenue: number;
}

export const reportsApi = {
  getProfitLoss(params: ReportParams) {
    const query = new URLSearchParams(params as unknown as Record<string, string>).toString();
    return api.get<ProfitLossReport>(`/api/reports/profit-loss?${query}`);
  },

  getSalesTrend(params: ReportParams) {
    const query = new URLSearchParams(params as unknown as Record<string, string>).toString();
    return api.get<SalesTrendItem[]>(`/api/reports/sales-trend?${query}`);
  },

  getStockValuation() {
    return api.get<StockValuationItem[]>("/api/reports/stock-valuation");
  },

  getBestSellers(params: ReportParams) {
    const query = new URLSearchParams(params as unknown as Record<string, string>).toString();
    return api.get<{ productId: string; name: string; sold: number; revenue: number }[]>(
      `/api/reports/best-sellers?${query}`
    );
  },

  getTaxReport(params: ReportParams) {
    const query = new URLSearchParams(params as unknown as Record<string, string>).toString();
    return api.get<{ taxCollected: number; taxable: number; period: ReportParams }>(
      `/api/reports/tax?${query}`
    );
  },
};
