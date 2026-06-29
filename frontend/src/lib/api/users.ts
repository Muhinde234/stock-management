import { api } from "./client";

export type AppRole = "admin" | "manager" | "cashier" | "stock_keeper";

export interface AppUser {
  id:         number;
  email:      string;
  full_name:  string | null;
  role:       AppRole;
  shop_id?:   number;
  stock_id?:  number;
  shop?:      { id: number; shopName: string };
  stock?:     { id: number; name: string };
  status?:    "active" | "inactive";
  created_at: string;
  updated_at?: string;
}

export interface UserCreate {
  email:     string;
  password:  string;
  full_name: string;
  role:      AppRole;
  shop_id?:  number;
  stock_id?: number;
}

export interface UserUpdate {
  email?:     string;
  full_name?: string;
  role?:      AppRole;
}

export const usersApi = {
  getAll(params?: { shop_id?: number; role?: AppRole }) {
    const query = params
      ? new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)])
          )
        ).toString()
      : "";
    return api.get<AppUser[]>(`/users${query ? `?${query}` : ""}`);
  },
  getById: (id: number)                      => api.get<AppUser>(`/users/${id}`),
  create:  (payload: UserCreate)             => api.post<AppUser>("/users", payload),
  update:  (id: number, payload: UserUpdate) => api.patch<AppUser>(`/users/${id}`, payload),
  delete:  (id: number)                      => api.delete<void>(`/users/${id}`),
};
