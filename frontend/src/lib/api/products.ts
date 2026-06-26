import { api } from "./client";
import type { Category } from "./categories";
export type { Category };

export interface Product {
  id: number;
  name: string;
  description?: string;
  category_id: number;
  category?: Category;
  sku: string;
  barcode?: string;
  buying_price: number | string;   // backend returns as string
  selling_price: number | string;  // backend returns as string
  quantity_in_stock: number;
  minimum_stock: number;
  expiry_date?: string;
  status: "active" | "inactive";
  is_deleted?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ProductPayload {
  name: string;
  description?: string;
  category_id: number;
  sku: string;
  barcode?: string;
  buying_price: number;
  selling_price: number;
  quantity_in_stock: number;
  minimum_stock: number;
  expiry_date?: string;
  status: "active" | "inactive";
}

export interface GetProductsParams {
  search?:      string;
  category_id?: number;
  status?:      string;
  skip?:        number;
  limit?:       number;
}

/** Safely parse price regardless of whether backend returns string or number */
export function parsePrice(val: number | string): number {
  return typeof val === "number" ? val : parseFloat(val) || 0;
}

export const productsApi = {
  getAll(params?: GetProductsParams) {
    const query = params
      ? new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v !== undefined && v !== "")
              .map(([k, v]) => [k, String(v)])
          )
        ).toString()
      : "";
    return api.get<Product[]>(`/products${query ? `?${query}` : ""}`);
  },

  getById(id: number) {
    return api.get<Product>(`/products/${id}`);
  },

  getByBarcode(barcode: string) {
    return api.get<Product>(`/products/barcode?barcode=${encodeURIComponent(barcode)}`);
  },

  create(payload: ProductPayload) {
    return api.post<Product>("/products", payload);
  },

  update(id: number, payload: Partial<ProductPayload>) {
    return api.put<Product>(`/products/${id}`, payload);
  },

  delete(id: number) {
    return api.delete<void>(`/products/${id}`);
  },
};
