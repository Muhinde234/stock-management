import { api } from "./client";

export interface Unit {
  id:         number;
  unitName:   string;
  created_at: string;
  updated_at?: string;
}

export const unitsApi = {
  getAll() {
    return api.get<Unit[]>("/units");
  },
  create(unitName: string) {
    return api.post<Unit>("/units", { unitName });
  },
};
