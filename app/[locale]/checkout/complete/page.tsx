import type { Metadata } from 'next'
import { CheckoutCompleteContent } from '@/components/checkout/CheckoutCompleteContent'

export const metadata: Metadata = {
  title: 'Completing your order | Increddy',
  robots: { index: false, follow: false },
}

export default function CheckoutCompletePage() {
  return <CheckoutCompleteContent />
}
