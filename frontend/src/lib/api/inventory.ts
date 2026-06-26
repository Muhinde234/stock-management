import { api } from "./client";

export interface StockMovement {
  id: string;
  type: "stock_in" | "stock_out" | "adjustment" | "transfer" | "damaged" | "expired";
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  fromWarehouse?: string;
  toWarehouse?: string;
  reason?: string;
  reference?: string;
  performedBy: string;
  createdAt: string;
}

export interface StockMovementsResponse {
  data: StockMovement[];
  total: number;
  page: number;
  limit: number;
}

export interface StockInPayload {
  productId: string;
  quantity: number;
  warehouse: string;
  reference?: string;
  notes?: string;
}

export interface StockAdjustPayload {
  productId: string;
  newQuantity: number;
  reason: string;
  warehouse: string;
}

export interface TransferPayload {
  productId: string;
  quantity: number;
  fromWarehouse: string;
  toWarehouse: string;
  notes?: string;
}

export const inventoryApi = {
  getMovements(params?: { page?: number; limit?: number; type?: string; productId?: string }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return api.get<StockMovementsResponse>(`/api/inventory${query ? `?${query}` : ""}`);
  },

  stockIn(payload: StockInPayload) {
    return api.post<StockMovement>("/api/inventory/stock-in", payload);
  },

  adjust(payload: StockAdjustPayload) {
    return api.post<StockMovement>("/api/inventory/adjust", payload);
  },

  transfer(payload: TransferPayload) {
    return api.post<StockMovement>("/api/inventory/transfer", payload);
  },
};
