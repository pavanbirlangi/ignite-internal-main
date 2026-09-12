import Cookies from 'js-cookie'

export const ACCESS_TOKEN_COOKIE = 'access_token'

let isUnauthorizedLogoutInProgress = false

const getLocalizedHomePath = () => {
  if (typeof window === 'undefined') return '/'

  const [firstSegment] = window.location.pathname.split('/').filter(Boolean)
  if (firstSegment && /^[a-z]{2}$/i.test(firstSegment)) {
    return `/${firstSegment.toLowerCase()}`
  }

  return '/'
}

const redirectAfterUnauthorizedLogout = () => {
  if (typeof window === 'undefined') return

  const homePath = getLocalizedHomePath()
  if (window.location.pathname !== homePath) {
    window.location.assign(homePath)
    return
  }

  window.location.reload()
}

/**
 * Shared 401-handling logic for both API clients (the legacy Shopify-BFF
 * client and the Medusa client) -- clears the session and bounces to the
 * localized home page if a request comes back unauthorized while a token is
 * still present client-side (i.e. the session expired/was revoked server-side).
 */
export const triggerUnauthorizedLogout = async () => {
  if (typeof window === 'undefined' || isUnauthorizedLogoutInProgress) {
    return
  }

  const token = Cookies.get(ACCESS_TOKEN_COOKIE)
  if (!token) {
    return
  }

  isUnauthorizedLogoutInProgress = true

  try {
    const { useUserStore } = await import('@/store/useUserStore')
    useUserStore.getState().logout()
    redirectAfterUnauthorizedLogout()
  } catch (logoutError) {
    console.error('Failed to auto-logout after 401 response:', logoutError)
  } finally {
    isUnauthorizedLogoutInProgress = false
  }
}
