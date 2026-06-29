import { api } from "./client";

export interface ShopManager {
  id: number;
  email: string;
  full_name: string;
  role: string;
  shop_id?: number;
  shop?: { id: number; shopName: string };
  status?: "active" | "inactive";
  created_at: string;
  updated_at?: string;
}

export interface ShopManagerCreate {
  email: string;
  password: string;
  full_name: string;
  role: "manager";
  shop_id?: number;
}

// PATCH /users/:id only accepts email, full_name, role — NOT shop_id
export interface ShopManagerUpdate {
  email?:     string;
  full_name?: string;
}

export const shopManagersApi = {
  getAll:  ()                                        => api.get<ShopManager[]>("/users/managers"),
  getById: (id: number)                              => api.get<ShopManager>(`/users/${id}`),
  create:  (payload: ShopManagerCreate)              => api.post<ShopManager>("/users", payload),
  update:  (id: number, payload: ShopManagerUpdate)  => api.patch<ShopManager>(`/users/${id}`, payload),
  delete:  (id: number)                              => api.delete<void>(`/users/${id}`),
};
