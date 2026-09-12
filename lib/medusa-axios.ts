import axios from 'axios'
import Cookies from 'js-cookie'
import { extractApiErrorMessage } from './utils/api-error'
import { triggerUnauthorizedLogout, ACCESS_TOKEN_COOKIE } from './utils/auth-session'

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

medusaClient.interceptors.request.use(
  async (config) => {
    // Don't override an explicit Authorization header a caller already set
    // (e.g. auth.service.ts passing a registration/reset token directly).
    if (config.headers.Authorization) {
      return config
    }

    let token: string | undefined

    if (typeof window !== 'undefined') {
      token = Cookies.get(ACCESS_TOKEN_COOKIE)
    } else {
      try {
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value
      } catch {
        // Failsafe if next/headers is not available (e.g. inside unstable_cache)
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

medusaClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      void triggerUnauthorizedLogout()
    }

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
