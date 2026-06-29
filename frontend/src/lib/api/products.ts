import { api } from "./client";
import type { Category } from "./categories";
import type { Unit } from "./units";
export type { Category };

export type StockStatus = "in_stock" | "out_of_stock";

export interface Product {
  id:                   number;
  productName:          string;
  quantityUnit:         number | Unit;   // unit ID or expanded unit object
  sellingPrice:         number | string;
  productPrice?:        number | string; // buying / purchase price
  minimumQuantity:      number;
  initialQuantity?:     number;          // current stock level
  category_id:          number;
  category?:            Category;
  sku?:                 string;
  stock_id?:            number;
  expiry_date?:         string;
  status:               "active" | "inactive";
  stock_status:         StockStatus;
  profit_per_unit?:     number | string;
  profit_margin_percent?: number | string;
  additionalProperties?: Record<string, string>;
  created_at:           string;
  updated_at?:          string;
}

export interface ProductPayload {
  productName:           string;
  quantityUnit:          number;          // unit ID
  sellingPrice:          number;
  minimumQuantity:       number;
  category_id:           number;
  productPrice?:         number;          // buying price
  initialQuantity?:      number;
  expiry_date?:          string;
  status:                "active" | "inactive";
  sku?:                  string;
  stock_id?:             number;
  additionalProperties?: Record<string, string>;
}

export interface GetProductsParams {
  search?:       string;
  category_id?:  number;
  stock_id?:     number;
  status?:       string;
  stock_status?: string;
  skip?:         number;
  limit?:        number;
}

/** Safely parse price regardless of whether backend returns string or number */
export function parsePrice(val: number | string | undefined | null): number {
  if (val === undefined || val === null) return 0;
  return typeof val === "number" ? val : parseFloat(val) || 0;
}

/** Get unit name from a product's quantityUnit (could be id or object) */
export function getUnitName(quantityUnit: number | Unit | undefined, units: Unit[]): string {
  if (quantityUnit === undefined) return "";
  if (typeof quantityUnit === "object") return quantityUnit.unitName;
  const found = units.find(u => u.id === quantityUnit);
  return found?.unitName ?? String(quantityUnit);
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

  getBySku(sku: string) {
    return api.get<Product>(`/products/sku?sku=${encodeURIComponent(sku)}`);
  },

  create(payload: ProductPayload) {
    return api.post<Product>("/products/register", payload);
  },

  update(id: number, payload: Partial<ProductPayload>) {
    return api.patch<Product>(`/products/${id}`, payload);
  },

  delete(id: number) {
    return api.delete<void>(`/products/${id}`);
  },
};
