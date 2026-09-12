import { useQuery } from '@tanstack/react-query'
import { LegalService } from '@/lib/services/legal.service'

export const useLegalPage = (slug: string) => {
  return useQuery({
    queryKey: ['legal-page', slug],
    queryFn: () => LegalService.getPageBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  })
}

export const useLegalPages = () => {
  return useQuery({
    queryKey: ['legal-pages-list'],
    queryFn: () => LegalService.getAllPages(),
    staleTime: 5 * 60 * 1000,
  })
}
