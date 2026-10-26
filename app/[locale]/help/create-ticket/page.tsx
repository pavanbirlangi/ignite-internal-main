'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import GuidesBreadcrumb from '@/components/help/activation-guides/GuidesBreadcrumb'
import { SelectOrder } from '@/components/help/SelectOrder'
import { CreateTicketForm } from '@/components/help/CreateTicketForm'
import { TicketCreatedSuccess } from '@/components/help/TicketCreatedSuccess'
import { ACCOUNT_PRIMARY_BUTTON_CLASS, ACCOUNT_SECONDARY_BUTTON_CLASS } from '@/components/library/account-ui'
import { orderService } from '@/lib/services/order.service'
import { helpdeskService } from '@/lib/services/helpdesk.service'
import { HelpService } from '@/lib/services/help.service'
import { GLOBAL_TICKET_PATH } from '@/lib/help/help-links'
import { toTicketOrder } from '@/lib/help/ticket-order'
import { localizedHref } from '@/lib/utils'
import { useUserStore } from '@/store/useUserStore'
import { useAuthModalStore } from '@/store/useAuthModalStore'
import type { CreateTicketStep, OrderItem, TicketFormData } from '@/types/HelpTypes'

type ReadTopic = { title: string; issueTypeSlug?: string }

// An order ticket: pick the order (skipped when ?order= names one, e.g. from the hub's
// "Get help"), then the form. ?topic= (from an answers page) is shown and suggests the issue.
function CreateTicket() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale = 'en' } = useParams<{ locale?: string }>() ?? {}
  const href = (path: string) => localizedHref(locale, path)
  const user = useUserStore((s) => s.user)
  const openModal = useAuthModalStore((s) => s.openModal)

  const orderParam = searchParams.get('order')
  const topicParam = searchParams.get('topic')

  const [step, setStep] = useState<CreateTicketStep>({ view: 'selectOrder' })
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [topic, setTopic] = useState<ReadTopic | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    orderService
      .getOrders({ first: 50 })
      .then(({ orders: raw }) => {
        if (cancelled) return
        const mapped = raw.map(toTicketOrder)
        setOrders(mapped)
        const preselected = orderParam ? mapped.find((o) => o.id === orderParam.replace(/^#/, '')) : undefined
        if (preselected) setStep({ view: 'createTicket', order: preselected })
      })
      .catch(() => {
        if (cancelled) return
        toast.error('Could not load your orders. Please try again.')
        setOrders([])
      })
      .finally(() => !cancelled && setIsLoadingOrders(false))
    return () => {
      cancelled = true
    }
  }, [user, orderParam])

  useEffect(() => {
    if (!topicParam) return
    let cancelled = false
    HelpService.getAllHelpTopics()
      .then(({ data }) => {
        const found = data?.find((t) => t.slug === topicParam)
        if (!cancelled && found) setTopic({ title: found.title, issueTypeSlug: found.issue_type?.slug })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [topicParam])

  const handleTicketSubmit = useCallback(
    async (data: TicketFormData) => {
      if (step.view !== 'createTicket') return
      setIsSubmitting(true)
      try {
        const order = step.order
        const transactionID = data.attachments.length > 0 ? await helpdeskService.uploadAttachments(data.attachments) : undefined
        const message = [
          `Issue Type: ${data.issue}`,
          ...(topic ? [`Help topic read: ${topic.title}`] : []),
          `Description: ${data.description}`,
          ...(data.resolutionType ? [`Preferred Resolution: ${data.resolutionType}`] : []),
          `Order ID: ${order.id}`,
        ].join('\n\n')

        const { ticketId, shortId } = await helpdeskService.createTicket({
          subject: `Support Request: Order #${order.id}, ${data.issue}`,
          requesterEmail: user?.email ?? 'unknown@increddy.com',
          requesterName: user?.displayName || undefined,
          message,
          customFields: { orderId: order.id },
          transactionID,
        })
        toast.success(`Ticket #${shortId} sent`)
        setStep({ view: 'ticketCreatedSuccess', order, ticketId, shortId })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'The ticket could not be sent. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [step, topic, user],
  )

  let body: React.ReactNode
  if (!user) {
    body = (
      <div className="max-w-180">
        <h1 data-display className="text-2xl leading-tight font-bold text-white/95 md:text-3xl">Create a ticket</h1>
        <p className="mt-2 text-base text-white/65">
          Sign in so we can see your orders and fill in the details. Not about an order? You can send a ticket
          without signing in.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => openModal('login')} className={ACCOUNT_PRIMARY_BUTTON_CLASS}>
            Sign in
          </button>
          <Link href={href(GLOBAL_TICKET_PATH)} className={ACCOUNT_SECONDARY_BUTTON_CLASS}>
            Continue without an order
          </Link>
        </div>
      </div>
    )
  } else if (step.view === 'createTicket') {
    body = (
      <CreateTicketForm
        order={step.order}
        topic={topic}
        isSubmitting={isSubmitting}
        onChangeOrder={() => setStep({ view: 'selectOrder' })}
        onSubmit={handleTicketSubmit}
        onCancel={() => router.push(href('/help'))}
      />
    )
  } else if (step.view === 'ticketCreatedSuccess') {
    body = (
      <TicketCreatedSuccess
        order={step.order}
        shortId={step.shortId}
        ticketsHref={href(step.ticketId ? `/dashboard/my-tickets/${step.ticketId}` : '/dashboard/my-tickets')}
        helpHref={href('/help')}
      />
    )
  } else {
    body = (
      <SelectOrder
        orders={orders}
        isLoading={isLoadingOrders}
        onSelectOrder={(order) => setStep({ view: 'createTicket', order })}
        noOrderHref={href(GLOBAL_TICKET_PATH)}
      />
    )
  }

  return (
    <div className="container pt-6 pb-16 md:pt-8 md:pb-20">
      <div className="mb-3.5">
        <GuidesBreadcrumb locale={locale} items={[{ name: 'Help Centre', path: '/help' }, { name: 'Create a ticket' }]} />
      </div>
      {body}
    </div>
  )
}

export default function CreateTicketPage() {
  return (
    <Suspense fallback={<div className="container min-h-[50vh] pt-8" />}>
      <CreateTicket />
    </Suspense>
  )
}
