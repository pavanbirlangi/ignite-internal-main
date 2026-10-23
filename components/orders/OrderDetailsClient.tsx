'use client'

import { ChevronLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { OrderDetailItem } from '@/components/orders/OrderDetailItem'
import { TransactionDetails } from '@/components/orders/TransactionDetails'
import { getCustomerOrderStatus, ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from '@/lib/orders/order-status'
import {
  ACCOUNT_CARD_CLASS,
  ACCOUNT_PRIMARY_BUTTON_CLASS,
  ACCOUNT_SECONDARY_BUTTON_CLASS,
  ACCOUNT_SECTION_LABEL_CLASS,
  AccountPageHeader,
  StatusPill,
} from '@/components/library/account-ui'
import { cn } from '@/lib/utils'
import { RevealProductModal } from '@/components/library/RevealProductModal'
import {
  formatOrderDate,
  formatOrderPrice,
} from '@/lib/orders/order-formatters'
import { generateReceiptPdf } from '@/lib/orders/generate-receipt-pdf'
import { generateKeysPdf } from '@/lib/orders/generate-keys-pdf'
import { orderService, type OrderDetails } from '@/lib/services/order.service'
import { keysService, type KeyAssignment } from '@/lib/services/keys.service'
import type { OrderDetailsClientProps } from '@/types/OrderDetailsTypes'
import type { ProductDetails } from '@/components/library/reveal-product-modal/types'
import { getVariantDisplayName } from '@/lib/orders/variant-title'
import { getForeignCharge, getPaymentMethodName } from '@/lib/orders/payment-method'

// Paid orders have a receipt, including partly refunded ones (it lists the refund).
const hasReceipt = (order: OrderDetails) =>
  order.financialStatus === 'PAID' || order.financialStatus === 'PARTIALLY_REFUNDED'

// An amount for an optional Transaction Details row -- undefined (row hidden) when it's zero.
function formatOptionalAmount(price: OrderDetails['totalTaxV2'], sign = ''): string | undefined {
  const amount = Number(price?.amount ?? 0)
  return amount > 0 ? `${sign}${formatOrderPrice(amount, price?.currencyCode)}` : undefined
}

export default function OrderDetailsClient({
  orderId,
}: OrderDetailsClientProps) {
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // View Key modal state
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductDetails | null>(
    null,
  )

  // Keys are fetched only when "Download All Keys" is clicked: on this backend fetching a key
  // *is* the reveal, so loading them with the page marked every key revealed unseen.
  const [keysLoading, setKeysLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const normalizedOrderId = orderId?.trim()

    if (!normalizedOrderId || normalizedOrderId === 'undefined') {
      setOrder(null)
      setError('Invalid order id')
      setIsLoading(false)
      return () => {
        isMounted = false
      }
    }

    async function loadOrderDetails() {
      setIsLoading(true)
      setError(null)

      try {
        const data = await orderService.getOrderById(normalizedOrderId)
        if (isMounted) {
          setOrder(data)
        }
      } catch (requestError) {
        if (isMounted) {
          setError('Failed to load order details')
          setOrder(null)
        }
        console.error('Failed to fetch order details:', requestError)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadOrderDetails()

    return () => {
      isMounted = false
    }
  }, [orderId])

  const lineItems = order?.lineItems?.edges ?? []

  const paymentMode = [
    order?.paymentMethod?.brand,
    order?.paymentMethod?.lastDigits,
  ]
    .filter(Boolean)
    .join(' ')

  const paymentModeDisplay = paymentMode || getPaymentMethodName(order?.paymentMethod)

  // -- Handlers --

  function handleViewKey(item: (typeof lineItems)[number]) {
    const node = item.node
    const variant = node?.variant
    const productTitle = node?.title || 'Untitled Product'

    const nodeTags = node?.tags ?? variant?.product?.tags ?? []
    const nodeCategories = (node?.categories ?? []).map((c) =>
      typeof c === 'string' ? c : (c as { title: string }).title,
    )
    const variantTitle = variant?.title ?? ''
    const selectedOptions =
      node?.variant_info?.selectedOptions ??
      variant?.selectedOptions ??
      []

    setSelectedProduct({
      orderId: order?.id ?? '',
      variantId: variant?.id ?? '',
      imageUrl: variant?.image?.url ?? '/images/404.png',
      title: productTitle,
      handle: variant?.product?.handle ?? '',
      platforms: [],
      tags: nodeTags,
      categories: nodeCategories,
      productType: '',
      variantTitle,
      selectedOptions,
      revealDate: order?.processedAt ?? new Date().toISOString(),
    })
    setIsKeyModalOpen(true)
  }

  function handleCloseKeyModal() {
    setIsKeyModalOpen(false)
    setSelectedProduct(null)
  }

  function handleDownloadReceipt() {
    if (order) {
      generateReceiptPdf(order)
    }
  }

  async function handleDownloadAllKeys() {
    if (!order) return

    setKeysLoading(true)
    try {
      const keys: KeyAssignment[] = await keysService.getOrderKeys(order.id)
      generateKeysPdf(order, keys)
    } catch (err) {
      console.error('Failed to fetch license keys:', err)
      toast.error('Could not load your keys. Please try again.')
    } finally {
      setKeysLoading(false)
    }
  }

  const displayStatus = order ? getCustomerOrderStatus(order) : null

  return (
    <>
      <Link
        href="/dashboard/my-orders"
        className="mb-3 inline-flex items-center gap-1 rounded-md text-sm text-white/65 transition-colors outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <ChevronLeft className="size-4" />
        My Orders
      </Link>

      <AccountPageHeader
        title={order ? `Order #${order.orderNumber}` : 'Order Details'}
        subtitle={order?.processedAt ? `Placed ${formatOrderDate(order.processedAt)}` : undefined}
        action={
          displayStatus && (
            <StatusPill tone={ORDER_STATUS_TONE[displayStatus]}>{ORDER_STATUS_LABEL[displayStatus]}</StatusPill>
          )
        }
      />

      {isLoading && (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="bg-card border-border h-40 flex-1 animate-pulse rounded-xl border" />
          <div className="bg-card border-border h-72 w-full animate-pulse rounded-xl border lg:w-[340px]" />
        </div>
      )}

      {!isLoading && error && (
        <div className={cn(ACCOUNT_CARD_CLASS, 'flex flex-col items-center justify-center gap-4 p-12 text-center')}>
          <p className="text-white/65">{error}</p>
        </div>
      )}

      {!isLoading && !error && order && (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Products */}
          <div className={cn(ACCOUNT_CARD_CLASS, 'min-w-0 flex-1 p-5')}>
            <h2 data-display className={cn(ACCOUNT_SECTION_LABEL_CLASS, 'mb-4')}>
              Products
            </h2>
            {lineItems.length > 0 ? (
              <div className="divide-border flex flex-col divide-y [&>*]:py-4 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
                {lineItems.map((item, index) => {
                  const node = item.node
                  const variant = node?.variant
                  const productTitle = node?.title || 'Untitled Product'
                  const variantName = getVariantDisplayName(variant?.title)

                  return (
                    <OrderDetailItem
                      key={variant?.id ?? `${productTitle}-${index}`}
                      image={variant?.image?.url ?? '/images/404.png'}
                      title={productTitle}
                      productHandle={variant?.product?.handle}
                      variantTitle={variantName}
                      price={formatOrderPrice(
                        variant?.price?.amount,
                        variant?.price?.currencyCode,
                      )}
                      quantity={node?.quantity ?? 1}
                      tags={node?.tags ?? variant?.product?.tags ?? []}
                      onReveal={() => handleViewKey(item)}
                    />
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-white/65">No items found in this order</p>
            )}
          </div>

          {/* Summary */}
          <TransactionDetails
            className="w-full shrink-0 lg:w-[340px]"
            transactionNumber={`${order.orderNumber}`}
            paymentMode={paymentModeDisplay}
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
            charged={(() => {
              const foreign = getForeignCharge(order.paymentMethod, order.totalPrice?.currencyCode)
              return foreign
                ? {
                    currency: foreign.currency.toUpperCase(),
                    amount: formatOrderPrice(foreign.amount, foreign.currency.toUpperCase()),
                  }
                : undefined
            })()}
            netPaid={formatOrderPrice(
              Math.max(
                0,
                Number(order.totalPrice?.amount ?? 0) - Number(order.totalRefundedV2?.amount ?? 0),
              ).toFixed(2),
              order.totalPrice?.currencyCode,
            )}
            total={formatOrderPrice(
              order.totalPrice?.amount,
              order.totalPrice?.currencyCode,
            )}
            actions={
              <>
                <button
                  type="button"
                  onClick={handleDownloadAllKeys}
                  disabled={keysLoading}
                  aria-busy={keysLoading || undefined}
                  className={cn(ACCOUNT_PRIMARY_BUTTON_CLASS, 'w-full')}
                >
                  <Download />
                  Download All Keys
                </button>
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  disabled={!hasReceipt(order)}
                  title={
                    !hasReceipt(order)
                      ? 'A receipt is available once payment is confirmed'
                      : undefined
                  }
                  className={cn(ACCOUNT_SECONDARY_BUTTON_CLASS, 'w-full')}
                >
                  <Download />
                  Download Receipt
                </button>
              </>
            }
          />
        </div>
      )}

      {/* View Key Modal */}
      {selectedProduct && (
        <RevealProductModal
          isOpen={isKeyModalOpen}
          onClose={handleCloseKeyModal}
          product={selectedProduct}
        />
      )}
    </>
  )
}
