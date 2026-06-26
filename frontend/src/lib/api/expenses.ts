import { api } from "./client";

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  paymentMethod: "cash" | "bank" | "mobile_money";
  reference?: string;
  notes?: string;
  date: string;
  createdBy: string;
  createdAt: string;
}

export interface ExpensesResponse {
  data: Expense[];
  total: number;
  page: number;
  limit: number;
}

export interface ExpensePayload {
  title: string;
  category: string;
  amount: number;
  paymentMethod: Expense["paymentMethod"];
  reference?: string;
  notes?: string;
  date: string;
}

export const expensesApi = {
  getAll(params?: { page?: number; limit?: number; category?: string; from?: string; to?: string }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return api.get<ExpensesResponse>(`/api/expenses${query ? `?${query}` : ""}`);
  },

  getById(id: string) {
    return api.get<Expense>(`/api/expenses/${id}`);
  },

  create(payload: ExpensePayload) {
    return api.post<Expense>("/api/expenses", payload);
  },

  update(id: string, payload: Partial<ExpensePayload>) {
    return api.put<Expense>(`/api/expenses/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<void>(`/api/expenses/${id}`);
  },
};
