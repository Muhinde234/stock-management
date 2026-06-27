import { api, getToken } from "./client";

// ── Types matching the real backend schema ────────────────────────────────────

export type PaymentMethod = "cash" | "card" | "mobile_money" | "other";
export type SaleStatus    = "completed" | "voided" | "pending" | string;

export interface SaleItemCreate {
  product_id?: number | null;
  barcode?:    string | null;
  quantity:    number;
}

export interface SaleCreate {
  cashier_id:      number;
  items:           SaleItemCreate[];
  discount_amount?: string | number;
  tax_amount?:      string | number;
  payment_method:  PaymentMethod;
  cash_received?:  string | number | null;
}

export interface SaleItemRead {
  product_id:    number;
  barcode?:      string;
  quantity:      number;
  unit_price:    string;
  total_price:   string;
}

export interface SaleRead {
  id:              number;
  sale_number:     string;
  sale_date:       string;
  subtotal:        string;
  discount_amount: string;
  tax_amount:      string;
  grand_total:     string;
  payment_method:  PaymentMethod;
  cash_received:   string | null;
  change_due:      string;
  status:          SaleStatus;
  cashier_id:      number;
  items:           SaleItemRead[];
}

/** Decode cashier_id from the stored JWT (sub claim) */
export function getCashierIdFromToken(): number {
  const token = getToken();
  if (!token) return 1;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return parseInt(payload.sub, 10) || 1;
  } catch {
    return 1;
  }
}

export const salesApi = {
  /** Create a sale / checkout */
  checkout(payload: SaleCreate) {
    return api.post<SaleRead>("/sales", payload);
  },

  getAll(params?: { skip?: number; limit?: number }) {
    const query = params
      ? new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)])
          )
        ).toString()
      : "";
    return api.get<SaleRead[]>(`/sales${query ? `?${query}` : ""}`);
  },

  getById(id: number) {
    return api.get<SaleRead>(`/sales/${id}`);
  },

  void(id: number) {
    return api.post<SaleRead>(`/sales/${id}/void`, {});
  },
};
