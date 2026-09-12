import apiClient from '../axios';

export interface Category {
  id: string;
  title: string;
  handle: string;
  description: string;
  image: string | null;
  count: number;
}

export const CategoryService = {
  getCategories: async (): Promise<{ categories: Category[] }> => {
    const response = await apiClient.get('/categories');
    return response.data;
  },
};
