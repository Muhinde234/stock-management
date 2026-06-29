import { api } from "./client";

export interface PurchaseItem {
  product_id?:   number;
  sku?:          string;
  quantity:      number;
  unit_price?:   number;
}

export interface PurchaseCreate {
  purchase_type:   "package" | "detail";  // backend values: package=box, detail=piece
  scanned_code:    string;
  product_id?:     number;
  sku?:            string;
  quantity?:       number;
  unit_price?:     number;
  supplier_name?:  string;
  supplier_phone?: string;
  notes?:          string;
}

export interface Purchase {
  id:              number;
  purchase_type?:  "package" | "detail";
  scanned_code?:   string;
  product_id?:     number;
  sku?:            string;
  quantity:        number;
  unit_price?:     number;
  supplier_name?:  string;
  supplier_phone?: string;
  notes?:          string;
  created_at:      string;
  updated_at?:     string;
}

export const purchasesApi = {
  getAll() {
    return api.get<Purchase[]>("/purchases");
  },

  getById(id: number) {
    return api.get<Purchase>(`/purchases/${id}`);
  },

  create(payload: PurchaseCreate) {
    return api.post<Purchase>("/purchases", payload);
  },

  delete(id: number) {
    return api.delete<void>(`/purchases/${id}`);
  },
};
