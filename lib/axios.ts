import axios from 'axios'
import Cookies from 'js-cookie'
import { extractApiErrorMessage } from './utils/api-error'
import { triggerUnauthorizedLogout } from './utils/auth-session'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  async (config) => {
    const isClient = typeof window !== 'undefined'
    let token: string | undefined
    let countryCode: string | undefined = undefined

    if (isClient) {
      token = Cookies.get('access_token')
      countryCode = Cookies.get('user_country')
    } else {
      try {
        const { cookies, headers } = await import('next/headers')
        const cookieStore = await cookies()
        token = cookieStore.get('access_token')?.value
        countryCode = cookieStore.get('user_country')?.value

        const headersList = await headers()
        const forwardedFor = headersList.get('x-forwarded-for') || headersList.get('x-real-ip')
        if (forwardedFor) {
          config.headers['X-Forwarded-For'] = forwardedFor.split(',')[0].trim()
        }
      } catch (error) {
        // Failsafe if next/headers is not available (e.g. inside unstable_cache)
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Append country param to GET requests if not already provided
    if (config.method?.toLowerCase() === 'get') {
      config.params = {
        ...(countryCode ? { country: countryCode } : {}), // Default country from cookie
        ...config.params, // Let caller override if they provided a specific country param
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

apiClient.interceptors.response.use(
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

export default apiClient
