import medusaClient from '../medusa-axios'

export interface WorksOn {
  name: string
  count: number
}

export const WorksOnService = {
  getWorksOn: async (): Promise<{ worksOn: WorksOn[] }> => {
    const response = await medusaClient.get('/store/facets', {
      params: { field: 'works_on' },
    })
    return { worksOn: response.data.facets ?? [] }
  },
}
