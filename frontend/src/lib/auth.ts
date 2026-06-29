import { getToken } from "./api/client";

export type UserRole = "admin" | "shop_manager" | "stock_keeper";

export interface CurrentUser {
  id: number;
  username: string;
  full_name?: string;
  role: UserRole;
  shop_id?: number;
  store_id?: number;
}

function normalizeRole(raw: string | undefined): UserRole {
  if (raw === "admin")                      return "admin";
  if (raw === "manager" || raw === "shop_manager") return "shop_manager";
  if (raw === "stock_keeper")               return "stock_keeper";
  return "stock_keeper";
}

export function getCurrentUser(): CurrentUser | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id:        parseInt(payload.sub, 10) || 0,
      username:  payload.username  ?? "",
      full_name: payload.full_name ?? undefined,
      role:      normalizeRole(payload.role),
      shop_id:   payload.shop_id   ?? undefined,
      store_id:  payload.store_id  ?? undefined,
    };
  } catch {
    return null;
  }
}

export function getUserRole(): UserRole {
  return getCurrentUser()?.role ?? "stock_keeper";
}
