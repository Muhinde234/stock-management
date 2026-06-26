import { api } from "./client";

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  totalPurchases: number;
  totalSpent: number;
  debtBalance: number;
  loyaltyPoints: number;
  status: "active" | "inactive" | "vip";
  createdAt: string;
  lastPurchaseAt?: string;
}

export interface CustomersResponse {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
}

export interface CustomerPayload {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export const customersApi = {
  getAll(params?: { page?: number; limit?: number; search?: string; status?: string }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return api.get<CustomersResponse>(`/api/customers${query ? `?${query}` : ""}`);
  },

  getById(id: string) {
    return api.get<Customer>(`/api/customers/${id}`);
  },

  create(payload: CustomerPayload) {
    return api.post<Customer>("/api/customers", payload);
  },

  update(id: string, payload: Partial<CustomerPayload>) {
    return api.put<Customer>(`/api/customers/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<void>(`/api/customers/${id}`);
  },

  getPurchaseHistory(id: string) {
    return api.get<{ data: unknown[] }>(`/api/customers/${id}/purchases`);
  },
};
