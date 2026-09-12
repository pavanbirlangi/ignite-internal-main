import axios from 'axios'
import { extractApiErrorMessage } from './utils/api-error'

/**
 * Axios client for the Medusa v2 backend's /store/* API.
 * Every /store/* route requires the publishable API key header regardless of
 * whether the request is also customer-authenticated.
 */
const medusaClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  },
})

medusaClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedMessage = extractApiErrorMessage(error)

    if (typeof normalizedMessage === 'string' && normalizedMessage.trim()) {
      error.message = normalizedMessage

      if (
        error?.response?.data &&
        typeof error.response.data === 'object' &&
        !Array.isArray(error.response.data)
      ) {
        error.response.data.message =
          error.response.data.message || normalizedMessage
      }
    }

    return Promise.reject(error)
  },
)

export default medusaClient
