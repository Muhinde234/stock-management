import { api } from "./client";

export interface Category {
  id: number;
  categoryName: string;
  created_at?: string;
  updated_at?: string;
}

interface CategoriesResponse {
  value: Category[];
  Count: number;
}

export const categoriesApi = {
  async getAll(): Promise<Category[]> {
    const res = await api.get<CategoriesResponse | Category[]>("/categories");
    // Backend returns { value: [...], Count: N }
    if (Array.isArray(res)) return res;
    return (res as CategoriesResponse).value ?? [];
  },

  create(categoryName: string) {
    return api.post<Category>("/categories", { categoryName });
  },
};
