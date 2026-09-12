import apiClient from '@/lib/axios'

export interface Market {
  id: string
  name: string
  status: string
  primary: boolean
  currencyCode: string
}

export interface GetMarketsResponse {
  markets: Market[]
}

export interface GetCurrenciesResponse {
  currencies: string[]
}

export const marketsService = {
  getMarkets: async (): Promise<Market[]> => {
    try {
      const response = await apiClient.get<GetMarketsResponse>('/markets')
      return response.data?.markets ?? []
    } catch (error) {
      console.error('Failed to fetch markets:', error)
      return []
    }
  },

  getCurrencies: async (): Promise<string[]> => {
    try {
      const response =
        await apiClient.get<GetCurrenciesResponse>('/markets/currencies')
      return response.data?.currencies ?? []
    } catch (error) {
      console.error('Failed to fetch currencies:', error)
      return []
    }
  },
}
