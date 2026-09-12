import medusaClient from '../medusa-axios'

export interface Genre {
  name: string;
  count: number;
}

export const GenreService = {
  getGenres: async (search?: string): Promise<{ genres: Genre[] }> => {
    const response = await medusaClient.get('/store/facets', {
      params: { field: 'genre' },
    })
    let genres: Genre[] = response.data.facets ?? []
    if (search) {
      const lower = search.toLowerCase()
      genres = genres.filter((g) => g.name.toLowerCase().includes(lower))
    }
    return { genres }
  },
};
