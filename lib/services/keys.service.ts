import apiClient from '@/lib/axios'

export interface LicenseKey {
  license_key: string
  product_id: string
  variant_id: string
  issued_at: string
}

export interface GetKeysResponse {
  success: boolean
  orderId: string
  customerEmail: string
  keys: LicenseKey[]
}

export const keysService = {
  /**
   * Fetch license keys for a given order.
   * GET /keys?orderId=<orderId>&email=<email>
   */
  getKeys: async (orderId: string, email: string): Promise<LicenseKey[]> => {
    const response = await apiClient.get<GetKeysResponse>('/keys', {
      params: { orderId, email },
    })

    if (!response.data?.success) {
      throw new Error('Failed to fetch license keys')
    }

    return response.data.keys ?? []
  },
}
