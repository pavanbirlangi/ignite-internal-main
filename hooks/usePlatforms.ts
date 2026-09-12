import { useQuery } from '@tanstack/react-query';
import { PlatformService } from '@/lib/services/platform.service';

export const usePlatforms = () => {
  return useQuery({
    queryKey: ['platforms'],
    queryFn: () => PlatformService.getPlatforms(),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};
