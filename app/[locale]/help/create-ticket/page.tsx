'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SelectOrder } from '@/components/help/SelectOrder'
import { CreateTicketForm } from '@/components/help/CreateTicketForm'
import { TicketCreatedSuccess } from '@/components/help/TicketCreatedSuccess'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { orderService } from '@/lib/services/order.service'
import { helpdeskService } from '@/lib/services/helpdesk.service'
import { useUserStore } from '@/store/useUserStore'
import { useAuthModalStore } from '@/store/useAuthModalStore'
import type { CreateTicketStep, OrderItem, TicketFormData } from '@/types/HelpTypes'
import type { Order } from '@/lib/services/order.service'

// ──────────────────── Helpers ────────────────────

function formatOrderDate(processedAt: string): string {
  try {
    return new Date(processedAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return processedAt
  }
}

function mapOrderToOrderItem(order: Order): OrderItem {
  const firstEdge = order.lineItems?.edges?.[0]
  const firstItem = firstEdge?.node
  const productTitle = firstItem?.title ?? 'Unknown product'
  const extraCount = (order.lineItems?.edges?.length ?? 1) - 1
  const products =
    extraCount > 0 ? `${productTitle} & ${extraCount} more` : productTitle
  const image = firstItem?.variant?.image?.url ?? undefined

  return {
    id: String(order.orderNumber),
    products,
    purchaseDate: formatOrderDate(order.processedAt),
    image,
  }
}

// ──────────────────── Page ────────────────────

export default function CreateTicketPage() {
  const router = useRouter()
  const user = useUserStore((s) => s.user)
  const openModal = useAuthModalStore((s) => s.openModal)

  const [step, setStep] = useState<CreateTicketStep>({ view: 'selectOrder' })
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reload the page when the user logs in so orders are fetched fresh
  const prevUserRef = useRef<typeof user>(user)
  useEffect(() => {
    const wasLoggedOut = prevUserRef.current === null
    const isNowLoggedIn = user !== null
    if (wasLoggedOut && isNowLoggedIn) {
      router.refresh()
    }
    prevUserRef.current = user
  }, [user, router])

  // Fetch real orders on mount
  useEffect(() => {
    if (!user) return // don't fetch if not logged in
    let cancelled = false

    const fetchOrders = async () => {
      setIsLoadingOrders(true)
      try {
        const { orders: rawOrders } = await orderService.getOrders({ first: 50 })
        if (!cancelled) {
          setOrders(rawOrders.map(mapOrderToOrderItem))
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch orders:', error)
          toast.error('Could not load your orders. Please try again.')
          setOrders([])
        }
      } finally {
        if (!cancelled) setIsLoadingOrders(false)
      }
    }

    fetchOrders()
    return () => { cancelled = true }
  }, [user])

  // Handle ticket submission
  const handleTicketSubmit = useCallback(
    async (data: TicketFormData) => {
      setIsSubmitting(true)
      try {
        const requesterEmail =
          user?.email ?? 'unknown@increddy.com'
        const requesterName =
          user?.displayName ||
          `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() ||
          undefined

        const orderItem = step.view === 'createTicket' ? step.order : null
        const orderId = orderItem?.id ?? data.orderId

        // 1. Upload attachments (non-blocking — failures are silently skipped)
        let transactionID: string | undefined
        if (data.attachments.length > 0) {
          transactionID = await helpdeskService.uploadAttachments(data.attachments)
        }

        // 2. Build the ticket message
        const messageParts = [
          `Issue Type: ${data.issue}`,
          `Description: ${data.description}`,
        ]
        if (data.resolutionType) {
          messageParts.push(`Preferred Resolution: ${data.resolutionType}`)
        }
        if (orderId) {
          messageParts.push(`Order ID: ${orderId}`)
        }
        const message = messageParts.join('\n\n')

        // 3. Create the ticket
        const { ticketId, shortId } = await helpdeskService.createTicket({
          subject: `Support Request — Order #${orderId} — ${data.issue}`,
          requesterEmail,
          requesterName,
          message,
          customFields: orderId ? { orderId } : undefined,
          transactionID,
        })

        toast.success(`Ticket #${shortId} created successfully!`)
        setStep({
          view: 'ticketCreatedSuccess',
          order: orderItem!,
          ticketId,
          shortId,
        })
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : 'Failed to create ticket. Please try again.'
        toast.error(msg)
      } finally {
        setIsSubmitting(false)
      }
    },
    [step, user],
  )

  // ──────────────────── Render ────────────────────

  // Guard: user not logged in
  if (!user) {
    return (
      <div className="bg-secondary/40 flex min-h-[400px] flex-col items-center justify-center gap-6 rounded-[20px] p-10 text-center">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">Login Required</h2>
          <p className="text-muted-foreground max-w-xs text-sm">
            You need to be logged in to raise a support ticket.
          </p>
        </div>
        <button
          onClick={() => openModal('login')}
          className="bg-primary hover:bg-primary/90 rounded-[8px] px-8 py-3 text-sm font-semibold text-white transition-colors"
        >
          Log In
        </button>
      </div>
    )
  }

  if (step.view === 'selectOrder') {
    return (
      <SelectOrder
        orders={orders}
        isLoading={isLoadingOrders}
        onSelectOrder={(order) => setStep({ view: 'createTicket', order })}
        onBack={() => router.back()}
      />
    )
  }

  if (step.view === 'createTicket') {
    return (
      <CreateTicketForm
        order={step.order}
        isSubmitting={isSubmitting}
        onBack={() => setStep({ view: 'selectOrder' })}
        onSubmit={handleTicketSubmit}
        onCancel={() => setStep({ view: 'selectOrder' })}
      />
    )
  }

  if (step.view === 'ticketCreatedSuccess') {
    return (
      <TicketCreatedSuccess
        order={step.order}
        ticketId={step.ticketId}
        shortId={step.shortId}
        onViewDetails={() => router.push(`/dashboard/my-tickets/${step.ticketId}`)}
      />
    )
  }

  return null
}
