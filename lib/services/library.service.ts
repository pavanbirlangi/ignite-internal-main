import apiClient from '@/lib/axios'
import type { GetLibraryParams, LibraryResponse } from '@/types/library'

export const libraryService = {
  getLibrary: async (
    params: GetLibraryParams = {},
  ): Promise<LibraryResponse> => {
    // Remove undefined or empty parameters
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(
        ([_, value]) => value !== undefined && value !== '',
      ),
    )

    const response = await apiClient.get<LibraryResponse>('/library', {
      params: cleanParams,
    })

    return response.data
  },
}
