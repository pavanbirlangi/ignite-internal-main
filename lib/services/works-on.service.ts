import apiClient from '../axios'

export interface WorksOn {
  name: string
  count: number
}

export const WorksOnService = {
  getWorksOn: async (): Promise<{ worksOn: WorksOn[] }> => {
    const response = await apiClient.get('/works-on')
    return response.data
  },
}
