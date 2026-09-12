import axios from 'axios'

type ApiErrorItem = {
  field?: string[]
  message?: string
}

type ApiErrorPayload = {
  message?: string
  errors?: ApiErrorItem[]
}

const GENERIC_AXIOS_ERROR_PREFIX = 'Request failed with status code'

export function extractApiErrorMessage(
  error: unknown,
  fallbackMessage = 'Something went wrong. Please try again.',
): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Unable to reach the server. Please check your internet connection.'
    }

    const data = error.response.data as ApiErrorPayload | string | undefined

    if (typeof data === 'string' && data.trim()) {
      return data
    }

    if (data && typeof data === 'object') {
      if (typeof data.message === 'string' && data.message.trim()) {
        return data.message
      }

      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const messages = data.errors
          .map((item) => item?.message?.trim())
          .filter((message): message is string => Boolean(message))

        if (messages.length > 0) {
          return messages.join(', ')
        }
      }
    }

    if (
      typeof error.message === 'string' &&
      error.message.trim() &&
      !error.message.startsWith(GENERIC_AXIOS_ERROR_PREFIX)
    ) {
      return error.message
    }

    return fallbackMessage
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallbackMessage
}

export function isCartNotFoundError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false
  }

  const status = error.response?.status
  if (status !== 400 && status !== 404) {
    return false
  }

  // Medusa's real shape (confirmed live): 404 { type: "not_found", message:
  // "Cart with id '...' not found" | "Cart id not found: ..." } -- neither
  // message form is consistent enough to match verbatim, so check for both
  // words instead.
  const message = extractApiErrorMessage(error, '').toLowerCase()
  return message.includes('cart') && message.includes('not found')
}
