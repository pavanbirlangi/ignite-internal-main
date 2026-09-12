import { useQuery } from '@tanstack/react-query';
import { CategoryService } from '@/lib/services/category.service';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => CategoryService.getCategories(),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};
