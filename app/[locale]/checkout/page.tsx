import type { Metadata } from 'next'
import { CheckoutPlaceholder } from '@/components/cart/CheckoutPlaceholder'

export const metadata: Metadata = {
  title: 'Checkout | Increddy',
  robots: { index: false, follow: false },
}

export default function CheckoutPage() {
  return <CheckoutPlaceholder />
}
