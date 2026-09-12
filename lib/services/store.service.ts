import cmsClient from '../cms-axios'
import type { SeoData } from '../seo'

export interface StoreData {
  id: string
  seo?: SeoData
  title: string
  description: string
  banner_image: string
}

export interface StoreResponse {
  data: StoreData
}

export const StoreService = {
  getStoreData: async (): Promise<StoreData> => {
    const response = await cmsClient.get<StoreResponse>('/items/store?fields=*,seo.*')
    return response.data.data
  },
}
