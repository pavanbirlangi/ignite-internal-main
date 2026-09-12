import medusaClient from '../medusa-axios'

export interface Platform {
  name: string;
  count: number;
}

export const PlatformService = {
  getPlatforms: async (): Promise<{ platforms: Platform[] }> => {
    const response = await medusaClient.get('/store/facets', {
      params: { field: 'platform' },
    })
    return { platforms: response.data.facets ?? [] }
  },
};
