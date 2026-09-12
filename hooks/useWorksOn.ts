import { useQuery } from '@tanstack/react-query'
import { WorksOnService } from '@/lib/services/works-on.service'

export const useWorksOn = () => {
  return useQuery({
    queryKey: ['works-on'],
    queryFn: () => WorksOnService.getWorksOn(),
    staleTime: 5 * 60 * 1000,
  })
}
