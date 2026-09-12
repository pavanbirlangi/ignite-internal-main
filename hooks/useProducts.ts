import { useQuery } from '@tanstack/react-query';
import { ProductService, GetProductsParams } from '@/lib/services/product.service';

export const useProducts = (params: GetProductsParams, enabled = true) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => ProductService.getProducts(params),
    enabled,
  });
};
