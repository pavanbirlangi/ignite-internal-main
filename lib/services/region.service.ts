import medusaClient from '../medusa-axios'

export interface Region {
  name: string;
  count: number;
}

export const RegionService = {
  getRegions: async (search?: string): Promise<{ regions: Region[] }> => {
    const response = await medusaClient.get('/store/facets', {
      params: { field: 'region' },
    })
    let regions: Region[] = response.data.facets ?? []
    if (search) {
      const lower = search.toLowerCase()
      regions = regions.filter((r) => r.name.toLowerCase().includes(lower))
    }
    return { regions }
  },
};
