import apiClient from '../axios';

export interface Platform {
  name: string;
  count: number;
}

export const PlatformService = {
  getPlatforms: async (): Promise<{ platforms: Platform[] }> => {
    const response = await apiClient.get('/platforms');
    return response.data;
  },
};
