import { api } from "./client";

export interface Cashier {
  id:         number;
  username:   string;
  full_name:  string | null;
  created_at: string;
}

export interface CashierCreate {
  username:   string;
  full_name?: string | null;
}

export const cashiersApi = {
  getAll() {
    return api.get<Cashier[]>("/cashiers");
  },

  create(payload: CashierCreate) {
    return api.post<Cashier>("/cashiers", payload);
  },
};
