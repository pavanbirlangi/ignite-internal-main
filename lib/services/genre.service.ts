import apiClient from '../axios';

export interface Genre {
  name: string;
  count: number;
}

export const GenreService = {
  getGenres: async (search?: string): Promise<{ genres: Genre[] }> => {
    const params = search ? { search } : undefined;
    const response = await apiClient.get('/genres', { params });
    return response.data;
  },
};
