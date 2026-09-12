import { useQuery } from '@tanstack/react-query'
import { AboutService } from '@/lib/services/about.service'

export const useAboutUs = () => {
  return useQuery({
    queryKey: ['about-us'],
    queryFn: () => AboutService.getAboutUsPage(),
    staleTime: 5 * 60 * 1000,
  })
}
