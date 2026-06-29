import { api } from "./client";

export interface Category {
  id:           number;
  categoryName: string;
  created_at?:  string;
  updated_at?:  string;
}

interface CategoriesResponse {
  value: Category[];
  Count: number;
}

export const categoriesApi = {
  async getAll(): Promise<Category[]> {
    const res = await api.get<CategoriesResponse | Category[]>("/categories");
    if (Array.isArray(res)) return res;
    return (res as CategoriesResponse).value ?? [];
  },

  create(categoryName: string) {
    return api.post<Category>("/categories", { categoryName });
  },

  update(id: number, categoryName: string) {
    return api.patch<Category>(`/categories/${id}`, { categoryName });
  },

  delete(id: number) {
    return api.delete<void>(`/categories/${id}`);
  },
};
