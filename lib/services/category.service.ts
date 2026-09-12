import medusaClient from '../medusa-axios'

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
    const response = await medusaClient.get('/store/product-categories/counts')
    const categories: Category[] = (response.data.categories ?? []).map(
      (c: any) => ({
        id: c.id,
        title: c.name,
        handle: c.handle,
        description: c.description || '',
        image: null,
        count: c.product_count ?? 0,
      }),
    )
    return { categories }
  },
};
