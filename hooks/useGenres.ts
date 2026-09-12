import { useQuery } from '@tanstack/react-query';
import { GenreService } from '@/lib/services/genre.service';

export const useGenres = (search?: string) => {
  return useQuery({
    queryKey: ['genres', search],
    queryFn: () => GenreService.getGenres(search),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};
