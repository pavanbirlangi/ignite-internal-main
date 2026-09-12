'use client'

import Link from 'next/link'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CartNavbar } from '@/components/cart/CartNavbar'

export function CheckoutPlaceholder() {
  return (
    <div className="bg-background min-h-screen font-sans">
      <CartNavbar currentStep={2} />

      <section className="border-muted-foreground/30 flex min-h-100 items-center justify-center border-y px-6 py-16 text-center md:min-h-120">
        <div className="mx-auto flex max-w-xl flex-col items-center">
          <div className="bg-secondary text-muted-foreground flex h-14 w-14 items-center justify-center rounded-full">
            <Clock className="h-7 w-7" />
          </div>

          <h1 className="mt-6 text-2xl leading-tight font-semibold tracking-tight text-white md:text-4xl">
            Checkout is coming soon
          </h1>

          <p className="text-muted-foreground mt-3 max-w-md text-base tracking-tight md:text-lg">
            We&apos;re still setting up secure payments. Your cart is saved --
            check back shortly to complete your purchase.
          </p>

          <Button
            asChild
            variant="primary"
            size="md"
            className="mt-8 px-6 py-3 text-sm font-semibold"
          >
            <Link href="/cart">Back to Cart</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
