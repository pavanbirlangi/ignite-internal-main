'use client'

import { useState, useCallback } from 'react'
import { GlobalTicketForm } from '@/components/help/GlobalTicketForm'
import { GlobalTicketCreatedSuccess } from '@/components/help/GlobalTicketCreatedSuccess'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { helpdeskService } from '@/lib/services/helpdesk.service'

export default function GlobalCreateTicketPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successData, setSuccessData] = useState<{
    orderId?: string
    shortId?: string
  } | null>(null)

  const handleTicketSubmit = useCallback(
    async (data: {
      orderId: string
      description: string
      attachments: File[]
      email: string
    }) => {
      setIsSubmitting(true)
      try {
        const requesterEmail = data.email
        const orderId = data.orderId
        const issue = 'General Issue' // Default for global form
        const resolutionType = ''

        // 1. Upload attachments
        let transactionID: string | undefined
        if (data.attachments.length > 0) {
          transactionID = await helpdeskService.uploadAttachments(data.attachments)
        }

        // 2. Build the ticket message
        const messageParts = [
          `Issue Type: ${issue}`,
          `Description: ${data.description}`,
        ]
        if (resolutionType) {
          messageParts.push(`Preferred Resolution: ${resolutionType}`)
        }
        if (orderId) {
          messageParts.push(`Order ID: ${orderId}`)
        }
        const message = messageParts.join('\n\n')

        // 3. Create the ticket
        const { shortId } = await helpdeskService.createTicket({
          subject: `Global Support Request — ${orderId ? `Order #${orderId} — ` : ''}${issue}`,
          requesterEmail,
          message,
          customFields: orderId ? { orderId } : undefined,
          transactionID,
        })

        toast.success(`Ticket #${shortId} created successfully!`)
        setSuccessData({
          orderId,
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
    [],
  )

  if (successData) {
    return (
      <GlobalTicketCreatedSuccess
        orderId={successData.orderId}
        shortId={successData.shortId}
        onClose={() => router.push('/help')}
      />
    )
  }

  return (
    <GlobalTicketForm
      isSubmitting={isSubmitting}
      onBack={() => router.back()}
      onSubmit={handleTicketSubmit}
      onCancel={() => router.push('/help')}
    />
  )
}
