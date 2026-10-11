import Cookies from 'js-cookie'
import type { LoginResponse } from '@/lib/services/auth.service'
import { useUserStore } from '@/store/useUserStore'
import { useCartStore } from '@/store/useCartStore'

// Same finish as a password or Google login: store the session, mark the user signed in, and move
// the guest cart onto the account.
export async function completeSignIn({ token }: LoginResponse): Promise<void> {
  Cookies.set('access_token', token.accessToken, {
    expires: new Date(token.expiresAt),
    path: '/',
  })
  useUserStore.getState().setIsAuthenticated(true)

  try {
    await useCartStore.getState().transferGuestCartToUser()
  } catch (cartError) {
    console.error('Failed to transfer cart after sign-in', cartError)
  }
}
