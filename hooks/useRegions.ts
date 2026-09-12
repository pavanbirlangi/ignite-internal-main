import { useQuery } from '@tanstack/react-query';
import { RegionService } from '@/lib/services/region.service';

export const useRegions = (search?: string) => {
  return useQuery({
    queryKey: ['regions', search],
    queryFn: () => RegionService.getRegions(search),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};
