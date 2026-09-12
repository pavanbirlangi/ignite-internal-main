import cmsClient from '../cms-axios'
import type { SeoData } from '../seo'
export interface LegalPage {
  id: string
  seo?: SeoData
  status: string
  slug: string
  page_content: string
}

export interface LegalPageResponse {
  data: LegalPage[]
}

export const LegalService = {
  getPageBySlug: async (slug: string): Promise<LegalPageResponse> => {
    const filter = encodeURIComponent(
      JSON.stringify({ slug: { _eq: slug } }),
    )
    const response = await cmsClient.get<LegalPageResponse>(
      `/items/legal_pages?filter=${filter}&fields=*,seo.*`,
    )
    return response.data
  },

  getAllPages: async (): Promise<{ data: { slug: string }[] }> => {
    const response = await cmsClient.get(
      `/items/legal_pages?fields=slug&sort=sort`,
    )
    return response.data
  },
}
