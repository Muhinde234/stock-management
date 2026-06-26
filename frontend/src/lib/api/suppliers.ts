import { api } from "./client";

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  totalOrders: number;
  totalPaid: number;
  balance: number;
  status: "active" | "inactive";
  createdAt: string;
}

export interface SuppliersResponse {
  data: Supplier[];
  total: number;
  page: number;
  limit: number;
}

export interface SupplierPayload {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  items: { productId: string; productName: string; quantity: number; unitPrice: number }[];
  total: number;
  status: "pending" | "received" | "partial" | "cancelled";
  expectedAt?: string;
  createdAt: string;
}

export const suppliersApi = {
  getAll(params?: { page?: number; limit?: number; search?: string }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return api.get<SuppliersResponse>(`/api/suppliers${query ? `?${query}` : ""}`);
  },

  getById(id: string) {
    return api.get<Supplier>(`/api/suppliers/${id}`);
  },

  create(payload: SupplierPayload) {
    return api.post<Supplier>("/api/suppliers", payload);
  },

  update(id: string, payload: Partial<SupplierPayload>) {
    return api.put<Supplier>(`/api/suppliers/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<void>(`/api/suppliers/${id}`);
  },

  getPurchaseOrders(supplierId: string) {
    return api.get<{ data: PurchaseOrder[] }>(`/api/suppliers/${supplierId}/orders`);
  },
};
