import { api } from "./client";

export interface Shop {
  id: number;
  shopName: string;   // backend uses camelCase
  address?: string;
  phone?: string;
  email?: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at?: string;
}

export interface ShopCreate {
  shopName: string;   // backend field name
  address?: string;
  phone?: string;
  email?: string;
}

export interface ShopUpdate extends Partial<ShopCreate> {
  manager_id?: number;
}

export const shopsApi = {
  getAll:   ()                                   => api.get<Shop[]>("/shops"),
  getById:  (id: number)                         => api.get<Shop>(`/shops/${id}`),
  create:   (payload: ShopCreate)                => api.post<Shop>("/shops", payload),
  update:   (id: number, payload: ShopUpdate)    => api.patch<Shop>(`/shops/${id}`, payload),
  delete:   (id: number)                         => api.delete<void>(`/shops/${id}`),
};
