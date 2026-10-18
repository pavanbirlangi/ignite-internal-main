'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CircleHelp } from 'lucide-react'
import { CartNavbar } from '@/components/cart/CartNavbar'
import OrderConfirmationStatus from '@/components/orders/OrderConfirmationStatus'
import { OrderDetailItem } from '@/components/orders/OrderDetailItem'
import { TransactionDetails } from '@/components/orders/TransactionDetails'
import { RevealProductModal } from '@/components/library/RevealProductModal'
import type { ProductDetails } from '@/components/library/reveal-product-modal/types'
import { ACCOUNT_CARD_CLASS } from '@/components/library/account-ui'
import { getConfirmationState } from '@/lib/orders/order-confirmation'
import { formatOrderDate, formatOrderPrice } from '@/lib/orders/order-formatters'
import { getVariantDisplayName } from '@/lib/orders/variant-title'
import { getForeignCharge, getPaymentMethodName } from '@/lib/orders/payment-method'
import { orderService, type OrderDetails } from '@/lib/services/order.service'
import { cn } from '@/lib/utils'

// An optional summary row's amount: undefined (row hidden) when it's zero.
function formatOptionalAmount(price: OrderDetails['totalTaxV2'], sign = ''): string | undefined {
  const amount = Number(price?.amount ?? 0)
  return amount > 0 ? `${sign}${formatOrderPrice(amount, price?.currencyCode)}` : undefined
}

export default function OrderConfirmationPageContent() {
  const params = useParams<{ id?: string | string[] }>()
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const validId = orderId?.trim() && orderId.trim() !== 'undefined' ? orderId.trim() : ''
  const [isLoading, setIsLoading] = useState(Boolean(validId))
  const [selectedProduct, setSelectedProduct] = useState<ProductDetails | null>(null)

  useEffect(() => {
    if (!validId) return
    let isMounted = true
    orderService
      .getOrderById(validId)
      .then((data) => isMounted && setOrder(data))
      .catch((error) => {
        console.error('Failed to fetch order details:', error)
        if (isMounted) setOrder(null)
      })
      .finally(() => isMounted && setIsLoading(false))
    return () => {
      isMounted = false
    }
  }, [validId])

  const state = getConfirmationState(order)
  const lineItems = order?.lineItems?.edges ?? []

  function openKey(item: (typeof lineItems)[number]) {
    const node = item.node
    const variant = node?.variant
    setSelectedProduct({
      orderId: order?.id ?? '',
      variantId: variant?.id ?? '',
      imageUrl: variant?.image?.url ?? '/images/404.png',
      title: node?.title || 'Untitled Product',
      handle: variant?.product?.handle ?? '',
      platforms: [],
      tags: node?.tags ?? variant?.product?.tags ?? [],
      categories: [],
      productType: '',
      variantTitle: variant?.title ?? '',
      selectedOptions: node?.variant_info?.selectedOptions ?? variant?.selectedOptions ?? [],
      revealDate: order?.processedAt ?? new Date().toISOString(),
    })
  }

  const paymentMode = order
    ? [order.paymentMethod?.brand, order.paymentMethod?.lastDigits].filter(Boolean).join(' ') ||
      getPaymentMethodName(order.paymentMethod)
    : '-'
  const foreign = order ? getForeignCharge(order.paymentMethod, order.totalPrice?.currencyCode) : null

  return (
    <div className="bg-background min-h-screen font-sans">
      <CartNavbar currentStep={3} />
      <main className="mx-auto w-full max-w-180 px-4 pt-10 pb-24 md:pt-16">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <span className="border-primary size-11 animate-spin rounded-full border-3 border-white/12 border-t-current text-[var(--primary)]" />
            <p className="text-sm text-white/65">Loading your order...</p>
          </div>
        ) : (
          <>
            <OrderConfirmationStatus
              state={state}
              orderNumber={order?.orderNumber}
              orderDate={order?.processedAt ? formatOrderDate(order.processedAt) : undefined}
              email={order?.email ?? undefined}
            />

            {order && state !== 'failed' && (
              <>
                {lineItems.length > 0 && (
                  <div className={cn(ACCOUNT_CARD_CLASS, 'mt-8 p-5')}>
                    <div className="divide-border flex flex-col divide-y [&>*]:py-4 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
                      {lineItems.map((item, index) => {
                        const node = item.node
                        const variant = node?.variant
                        return (
                          <OrderDetailItem
                            key={variant?.id ?? `${node?.title}-${index}`}
                            image={variant?.image?.url ?? '/images/404.png'}
                            title={node?.title || 'Untitled Product'}
                            productHandle={variant?.product?.handle}
                            variantTitle={getVariantDisplayName(variant?.title)}
                            price={formatOrderPrice(variant?.price?.amount, variant?.price?.currencyCode)}
                            quantity={node?.quantity ?? 1}
                            tags={[]}
                            onReveal={state === 'refunded' ? undefined : () => openKey(item)}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}

                <TransactionDetails
                  className="mt-4"
                  paymentMode={paymentMode}
                  subtotal={formatOrderPrice(order.itemsSubtotal, order.totalPrice?.currencyCode)}
                  discount={formatOptionalAmount(order.totalDiscountV2, '-')}
                  serviceFee={
                    order.platformFee
                      ? formatOrderPrice(order.platformFee, order.totalPrice?.currencyCode)
                      : undefined
                  }
                  serviceFeeLabel={order.platformFeeLabel}
                  tax={formatOptionalAmount(order.totalTaxV2)}
                  refunded={formatOptionalAmount(order.totalRefundedV2, '-')}
                  charged={
                    foreign
                      ? {
                          currency: foreign.currency.toUpperCase(),
                          amount: formatOrderPrice(foreign.amount, foreign.currency.toUpperCase()),
                        }
                      : undefined
                  }
                  netPaid={formatOrderPrice(
                    Math.max(
                      0,
                      Number(order.totalPrice?.amount ?? 0) - Number(order.totalRefundedV2?.amount ?? 0),
                    ).toFixed(2),
                    order.totalPrice?.currencyCode,
                  )}
                  total={formatOrderPrice(order.totalPrice?.amount, order.totalPrice?.currencyCode)}
                />
              </>
            )}

            <p className="mt-7 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-center text-sm text-white/65">
              <CircleHelp className="size-4" />
              Key not working?
              <Link
                href="/help"
                className="text-white/95 underline decoration-white/30 underline-offset-2 hover:decoration-white"
              >
                Create a ticket
              </Link>
              and we&apos;ll get back to you within 48 hours.
            </p>
          </>
        )}
      </main>

      {selectedProduct && (
        <RevealProductModal
          isOpen
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
        />
      )}
    </div>
  )
}
