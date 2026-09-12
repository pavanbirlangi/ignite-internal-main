'use client'

import StillExperiencingIssues from '@/components/help/StillExperiencingIssues'
import OrderProcessing from '@/components/orders/OrderProcessing'
import OrderConfirmationStatus from '@/components/orders/OrderConfirmationStatus'
import { TransactionDetailsGrid } from '@/components/orders/TransactionDetailsGrid'
import { buildOrderConfirmationViewModel } from '@/lib/orders/order-confirmation'
import { orderService, type OrderDetails } from '@/lib/services/order.service'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function OrderConfirmationPageContent() {
  const params = useParams<{ id?: string | string[] }>()
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const normalizedOrderId = orderId?.trim() ?? ''

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

  if (isLoading) {
    return (
      <main className="bg-background flex min-h-screen w-full flex-col items-center-safe justify-center gap-6 px-4 py-6 sm:px-6 md:gap-8 md:py-8">
        <OrderProcessing />
      </main>
    )
  }

  const confirmation = buildOrderConfirmationViewModel(order)

  return (
    <main className="bg-background flex min-h-screen w-full flex-col items-center-safe justify-center gap-6 px-4 py-6 sm:px-6 md:gap-8 md:py-8">
      <div className="w-full max-w-188 space-y-8 md:space-y-12">
        <OrderConfirmationStatus
          state={confirmation.confirmationState}
          orderCode={confirmation.orderCode}
          itemSummary={confirmation.itemSummary}
          productImage={confirmation.productImage}
        />
        {confirmation.confirmationState !== 'failed' && (
          <TransactionDetailsGrid
            orderId={confirmation.transactionNumber}
            orderAmount={confirmation.orderAmount}
            transactionNumber={confirmation.transactionNumber}
            serviceFee={confirmation.serviceFee}
            paymentMode={confirmation.paymentMode}
            savingDiscount="-"
          />
        )}
        {!error && <StillExperiencingIssues onCreateTicket={() => {}} />}
      </div>
    </main>
  )
}
