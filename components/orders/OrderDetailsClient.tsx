'use client'

import { ChevronRight, Download } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
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
import { keysService, type LicenseKey } from '@/lib/services/keys.service'
import { useUserStore } from '@/store/useUserStore'
import type { OrderDetailsClientProps } from '@/types/OrderDetailsTypes'
import type { ProductDetails } from '@/components/library/reveal-product-modal/types'

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

  // License keys state (for PDF download only – modal fetches its own)
  const [keysData, setKeysData] = useState<LicenseKey[]>([])
  const [keysLoading, setKeysLoading] = useState(false)
  const userEmail = useUserStore((state) => state.user?.email)

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

  // Fetch license keys for PDF download
  useEffect(() => {
    if (!order?.id || !userEmail) return

    let cancelled = false
    setKeysData([])
    setKeysLoading(true)

    async function fetchKeys() {
      try {
        const keys = await keysService.getKeys(order!.id, userEmail!)
        if (!cancelled) {
          setKeysData(keys)
        }
      } catch (err) {
        console.error('Failed to fetch license keys:', err)
      } finally {
        if (!cancelled) {
          setKeysLoading(false)
        }
      }
    }

    fetchKeys()

    return () => {
      cancelled = true
    }
  }, [order?.id, userEmail])

  const lineItems = order?.lineItems?.edges ?? []

  const paymentMode = [
    order?.paymentMethod?.brand,
    order?.paymentMethod?.lastDigits,
  ]
    .filter(Boolean)
    .join(' ')

  const paymentModeDisplay =
    paymentMode || order?.paymentMethod?.gateway || 'Not available'

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

  function handleDownloadAllKeys() {
    if (order) {
      generateKeysPdf(order, keysData)
    }
  }

  return (
    <>
      {/* Breadcrumb Header */}
      <div className="mb-6 flex min-w-0 flex-wrap items-center gap-2 md:mb-8 md:gap-3">
        <Link
          href="/dashboard/my-orders"
          className="text-muted-foreground text-lg leading-tight font-semibold transition-colors hover:text-white sm:text-2xl md:text-[34px]"
        >
          My Orders
        </Link>
        <ChevronRight className="text-muted-foreground size-5 shrink-0 sm:size-6 md:size-7" />
        <h1 className="text-lg leading-tight font-semibold text-white sm:text-2xl md:text-[34px]">
          Order Details
        </h1>
      </div>

      {/* Order Summary Card */}
      <div className="border-secondary bg-secondary/20 mb-8 rounded-xl border p-5 backdrop-blur-[50px]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex flex-wrap gap-8 md:gap-16">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">
                Purchased on
              </span>
              <span className="font-semibold text-white">
                {order?.processedAt ? formatOrderDate(order.processedAt) : '-'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">
                Order Amount
              </span>
              <span className="font-semibold text-white">
                {formatOrderPrice(
                  order?.totalPrice?.amount,
                  order?.totalPrice?.currencyCode,
                )}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">Order ID</span>
              <span className="font-semibold text-white uppercase">
                #{order?.orderNumber ?? '-'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleDownloadReceipt}
              disabled={!order}
              className="border-muted-foreground flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[6px] border px-6 text-sm font-medium text-white transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Download Receipt
            </button>
            <button
              onClick={handleDownloadAllKeys}
              disabled={!order || keysLoading}
              className="bg-primary hover:bg-primary/90 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[6px] px-6 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
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
          <p className="text-muted-foreground">{error}</p>
        </div>
      )}

      {/* Order Items List */}
      {!isLoading && !error && lineItems.length > 0 && (
        <div className="flex flex-col gap-4">
          {lineItems.map((item, index) => {
            const node = item.node
            const variant = node?.variant
            const productTitle = node?.title || 'Untitled Product'
            const variantName =
              variant?.title && variant.title !== 'Default Title'
                ? variant.title
                : undefined

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
          <p className="text-lg font-semibold text-white">
            No items found in this order
          </p>
        </div>
      )}

      {/* Transaction Details */}
      {!isLoading && !error && order && (
        <TransactionDetails
          transactionNumber={`${order.orderNumber}`}
          paymentMode={paymentModeDisplay}
          subtotal={formatOrderPrice(
            order.subtotalPriceV2?.amount,
            order.subtotalPriceV2?.currencyCode,
          )}
          tax={formatOrderPrice(
            order.totalTaxV2?.amount,
            order.totalTaxV2?.currencyCode,
          )}
          refunded={formatOrderPrice(
            order.totalRefundedV2?.amount,
            order.totalRefundedV2?.currencyCode,
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
