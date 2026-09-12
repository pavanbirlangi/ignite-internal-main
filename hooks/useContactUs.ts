import { useQuery } from '@tanstack/react-query'
import { HelpService } from '@/lib/services/help.service'

export const useContactUs = () => {
  return useQuery({
    queryKey: ['contact-us'],
    queryFn: () => HelpService.getContactUsPage(),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  })
}
