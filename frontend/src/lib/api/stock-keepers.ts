import { api } from "./client";

export interface StockKeeper {
  id:          number;
  full_name:   string | null;
  email?:      string;
  role?:       string;
  phone?:      string;
  store_id?:   number;
  stock_id?:   number;
  shop_id?:    number;
  store?:      { id: number; name: string };
  status:      "active" | "inactive";
  created_at:  string;
  updated_at?: string;
}

// POST /users
export interface StockKeeperCreate {
  full_name: string;
  email:     string;
  password:  string;
  role:      "stock_keeper" | "cashier";
  phone?:    string;
}

// PATCH /users/:id
export interface StockKeeperUpdate {
  full_name?: string;
  email?:     string;
  phone?:     string;
}

export const stockKeepersApi = {
  // Use Promise.allSettled so one failing endpoint doesn't break the other
  async getAll(): Promise<StockKeeper[]> {
    const [keepers, cashiers] = await Promise.allSettled([
      api.get<StockKeeper[]>("/users/stock-keepers"),
      api.get<StockKeeper[]>("/users/cashiers"),
    ]);
    return [
      ...(keepers.status  === "fulfilled" && Array.isArray(keepers.value)  ? keepers.value  : []),
      ...(cashiers.status === "fulfilled" && Array.isArray(cashiers.value) ? cashiers.value : []),
    ];
  },

  getById: (id: number)                             => api.get<StockKeeper>(`/users/${id}`),
  create:  (payload: StockKeeperCreate)             => api.post<StockKeeper>("/users", payload),
  update:  (id: number, payload: StockKeeperUpdate) => api.patch<StockKeeper>(`/users/${id}`, payload),
  delete:  (id: number)                             => api.delete<void>(`/users/${id}`),
};
