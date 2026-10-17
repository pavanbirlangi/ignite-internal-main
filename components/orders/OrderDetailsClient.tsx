'use client'

import { ChevronRight, Download } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { OrderDetailItem } from '@/components/orders/OrderDetailItem'
import { TransactionDetails } from '@/components/orders/TransactionDetails'
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

  return (
    <>
      {/* Breadcrumb Header */}
      <div className="mb-6 flex min-w-0 flex-wrap items-center gap-2 md:mb-8 md:gap-3">
        <Link
          href="/dashboard/my-orders"
          className="text-white/65 text-xl font-bold transition-colors hover:text-white sm:text-2xl md:text-3xl"
        >
          My Orders
        </Link>
        <ChevronRight className="text-white/65 size-5 shrink-0 sm:size-6 md:size-7" />
        <h1 className="text-xl font-bold text-white/95 sm:text-2xl md:text-3xl">
          Order Details
        </h1>
      </div>

      {/* Order Summary Card */}
      <div className="border-secondary bg-secondary/20 mb-8 rounded-xl border p-5 backdrop-blur-[50px]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex flex-wrap gap-8 md:gap-16">
            <div className="flex flex-col gap-1">
              <span className="text-white/65 text-sm">
                Purchased on
              </span>
              <span className="font-bold text-white/95">
                {order?.processedAt ? formatOrderDate(order.processedAt) : '-'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-white/65 text-sm">
                Order Amount
              </span>
              <span className="font-bold text-white/95">
                {formatOrderPrice(
                  order?.totalPrice?.amount,
                  order?.totalPrice?.currencyCode,
                )}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-white/65 text-sm">Order ID</span>
              <span className="font-bold text-white/95 uppercase">
                #{order?.orderNumber ?? '-'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleDownloadReceipt}
              disabled={!order || !hasReceipt(order)}
              title={
                order && !hasReceipt(order)
                  ? 'A receipt is available once payment is confirmed'
                  : undefined
              }
              className="border-muted-foreground flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[6px] border px-6 text-sm font-medium text-white/95 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Download Receipt
            </button>
            <button
              onClick={handleDownloadAllKeys}
              disabled={!order || keysLoading}
              className="bg-primary hover:bg-primary/90 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[6px] px-6 text-sm font-bold text-white/95 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Download All Keys
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="mt-8 flex flex-col gap-4">
          {[...Array(2)].map((_, index) => (
            <div
              key={index}
              className="border-secondary bg-secondary/20 h-35 animate-pulse rounded-xl border"
            />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="border-secondary bg-secondary/20 mt-8 flex flex-col items-center justify-center gap-4 rounded-xl border p-12 text-center">
          <p className="text-white/65">{error}</p>
        </div>
      )}

      {/* Order Items List */}
      {!isLoading && !error && lineItems.length > 0 && (
        <div className="flex flex-col gap-4">
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
      )}

      {!isLoading && !error && lineItems.length === 0 && (
        <div className="border-secondary bg-secondary/20 mt-8 flex flex-col items-center justify-center gap-2 rounded-xl border p-12 text-center">
          <p className="text-xl font-bold text-white/95">
            No items found in this order
          </p>
        </div>
      )}

      {/* Transaction Details */}
      {!isLoading && !error && order && (
        <TransactionDetails
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
        />
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
