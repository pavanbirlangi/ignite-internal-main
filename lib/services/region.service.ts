import apiClient from '../axios';

export interface Region {
  name: string;
  count: number;
}

export const RegionService = {
  getRegions: async (search?: string): Promise<{ regions: Region[] }> => {
    const params = search ? { search } : undefined;
    const response = await apiClient.get('/regions', { params });
    return response.data;
  },
};
