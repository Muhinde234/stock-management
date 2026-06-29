import { api } from "./client";

export type StockMovementStatus = "stock_in" | "stock_out";

export interface StockMovementCreate {
  sku:      string;           // primary product identifier per Swagger
  status:   StockMovementStatus;
  quantity: number;
  notes?:   string;
}

export interface StockMovementRead {
  id:              number;
  product_id:      number;
  sku:             string;
  status:          StockMovementStatus;
  quantity:        number;
  performed_by_id: number;
  notes?:          string;
  created_at:      string;
}

export const inventoryApi = {
  getAll(params?: { skip?: number; limit?: number; product_id?: number }) {
    const query = params
      ? new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)])
          )
        ).toString()
      : "";
    return api.get<StockMovementRead[]>(`/stock-movements${query ? `?${query}` : ""}`);
  },

  create(payload: StockMovementCreate) {
    return api.post<StockMovementRead>("/stock-movements", payload);
  },
};
