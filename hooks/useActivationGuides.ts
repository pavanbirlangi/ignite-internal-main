import { useQuery } from '@tanstack/react-query'
import { HelpService } from '@/lib/services/help.service'

export const useActivationGuides = () => {
  return useQuery({
    queryKey: ['activation-guides'],
    queryFn: () => HelpService.getActivationGuides(),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  })
}

export const useActivationGuideDetail = (slug: string) => {
  return useQuery({
    queryKey: ['activation-guide', slug],
    queryFn: () => HelpService.getActivationGuideBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  })
}

export const useSearchActivationGuides = (query: string) => {
  return useQuery({
    queryKey: ['activation-guides-search', query],
    queryFn: () => HelpService.searchActivationGuides(query),
    enabled: query.trim().length > 0,
    staleTime: 1 * 60 * 1000, 
  })
}
