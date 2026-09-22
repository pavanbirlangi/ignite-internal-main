import { toast } from 'sonner'
import { useUserStore } from '@/store/useUserStore'
import { useAuthModalStore } from '@/store/useAuthModalStore'

/**
 * Gate for every "go to checkout" action. Guest checkout is a real backend
 * rule, not a UI preference -- the license-key fulfillment workflow rejects
 * any order with no customer_id outright -- so an unauthenticated customer
 * has to be stopped here rather than discovering it after filling out the
 * payment form. `proxy.ts` blocks `/checkout` server-side too; this is the
 * friendly half that opens the login modal instead of a bare redirect.
 *
 * Returns true when the caller may proceed to `/checkout`.
 *
 * Reads the stores via `getState()` rather than hooks so this works from
 * event handlers and from non-component code (e.g. the add-to-cart toast).
 */
export function ensureCheckoutAllowed(): boolean {
  const { isAuthenticated } = useUserStore.getState()
  const { openModal } = useAuthModalStore.getState()

  if (!isAuthenticated) {
    toast.info('Please log in to proceed with checkout', {
      duration: 2000,
      position: 'top-right',
    })
    openModal('login')
    return false
  }

  return true
}
