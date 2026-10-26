'use client'

import { useCallback, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import GuidesBreadcrumb from '@/components/help/activation-guides/GuidesBreadcrumb'
import { GlobalTicketForm } from '@/components/help/GlobalTicketForm'
import { TicketCreatedSuccess } from '@/components/help/TicketCreatedSuccess'
import { helpdeskService } from '@/lib/services/helpdesk.service'
import { localizedHref } from '@/lib/utils'
import { useUserStore } from '@/store/useUserStore'

// The general ticket form (no order needed, no sign-in needed).
export default function GlobalCreateTicketPage() {
  const router = useRouter()
  const { locale = 'en' } = useParams<{ locale?: string }>() ?? {}
  const user = useUserStore((s) => s.user)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState<{ shortId?: string } | null>(null)

  const handleTicketSubmit = useCallback(
    async (data: { orderId: string; description: string; attachments: File[]; email: string }) => {
      setIsSubmitting(true)
      try {
        const issue = 'General Issue'
        const transactionID = data.attachments.length > 0 ? await helpdeskService.uploadAttachments(data.attachments) : undefined
        const message = [
          `Issue Type: ${issue}`,
          `Description: ${data.description}`,
          ...(data.orderId ? [`Order ID: ${data.orderId}`] : []),
        ].join('\n\n')

        const { shortId } = await helpdeskService.createTicket({
          subject: `Global Support Request: ${data.orderId ? `Order #${data.orderId}, ` : ''}${issue}`,
          requesterEmail: data.email,
          requesterName: user?.displayName || undefined,
          message,
          customFields: data.orderId ? { orderId: data.orderId } : undefined,
          transactionID,
        })
        toast.success(`Ticket #${shortId} sent`)
        setSent({ shortId })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'The ticket could not be sent. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [user],
  )

  return (
    <div className="container pt-6 pb-16 md:pt-8 md:pb-20">
      <div className="mb-3.5">
        <GuidesBreadcrumb locale={locale} items={[{ name: 'Help Centre', path: '/help' }, { name: 'Send us a ticket' }]} />
      </div>
      {sent ? (
        <TicketCreatedSuccess
          shortId={sent.shortId}
          ticketsHref={user ? localizedHref(locale, '/dashboard/my-tickets') : undefined}
          helpHref={localizedHref(locale, '/help')}
        />
      ) : (
        <GlobalTicketForm
          key={user?.email ?? 'guest'}
          defaultEmail={user?.email ?? ''}
          isSubmitting={isSubmitting}
          onSubmit={handleTicketSubmit}
          onCancel={() => router.push(localizedHref(locale, '/help'))}
        />
      )}
    </div>
  )
}
