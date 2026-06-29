import { api } from "./client";

// Backend calls branches "stocks" — the frontend labels them "stores/branches"

export interface Store {
  id:               number;
  name:             string;
  shop_id:          number;
  shop?:            { id: number; shopName: string };
  stock_keeper_id?: number;
  cashier_id?:      number;
  created_at:       string;
  updated_at?:      string;
  // kept for UI fallback display
  address?:         string;
  status?:          "active" | "inactive";
}

export interface StoreCreate {
  name:    string;
  shop_id: number;
}

export interface StoreUpdate {
  name?:            string;
  stock_keeper_id?: number;
  cashier_id?:      number;
}

export const storesApi = {
  getAll(params?: { shop_id?: number }) {
    const query = params?.shop_id ? `?shop_id=${params.shop_id}` : "";
    return api.get<Store[]>(`/stocks${query}`);
  },

  getById(id: number) {
    return api.get<Store>(`/stocks/${id}`);
  },

  create(payload: StoreCreate) {
    return api.post<Store>("/stocks", payload);
  },

  update(id: number, payload: StoreUpdate) {
    return api.patch<Store>(`/stocks/${id}`, payload);
  },

  delete(id: number) {
    return api.delete<void>(`/stocks/${id}`);
  },
};
