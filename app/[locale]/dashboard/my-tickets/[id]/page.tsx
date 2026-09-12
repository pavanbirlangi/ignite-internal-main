'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { TicketConversation } from '@/components/tickets/TicketConversation'
import { helpdeskService } from '@/lib/services/helpdesk.service'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import LeftArrowIcon from '@/components/icons/LeftArrowIcon'
import type { Message } from '@/types/TicketTypes'
import { useUserStore } from '@/store/useUserStore'
import { toast } from 'sonner'

interface TicketDetailsPageProps {
  params: Promise<{ id: string }>
}

function ConversationSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-8">
      <div className="flex items-start gap-3">
        <div className="bg-secondary size-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="bg-secondary h-4 w-24 rounded" />
          <div className="bg-secondary h-3 w-48 rounded" />
        </div>
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="bg-secondary size-14 shrink-0 rounded-full" />
          <div className="bg-secondary h-28 flex-1 rounded-4xl" />
        </div>
      ))}
    </div>
  )
}

export default function TicketDetailsPage({ params }: TicketDetailsPageProps) {
  const { id } = use(params)
  const user = useUserStore((state) => state.user)
  const isAuthenticated = useUserStore((state) => state.isAuthenticated)
  const fetchUser = useUserStore((state) => state.fetchUser)

  const [messages, setMessages] = useState<Message[]>([])
  const [orderId, setOrderId] = useState<string>('')
  const [shortId, setShortId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isReplying, setIsReplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTicket = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true)
      setError(null)
      try {
        const { ticket, messages: msgs } = await helpdeskService.getTicketById(
          id,
          {
            name:
              [user?.firstName, user?.lastName]
                .filter(Boolean)
                .join(' ')
                .trim() ||
              user?.displayName ||
              user?.email ||
              null,
            avatar: user?.profile_photo || null,
          },
        )

        console.log(ticket, msgs)

        setMessages(msgs)
        const customFields = ticket.customFields ?? {}
        setOrderId(
          customFields.orderId ??
            customFields['order-id'] ??
            ticket.shortID ??
            id,
        )
        setShortId(ticket.shortID ?? '')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load ticket')
      } finally {
        if (showLoading) setIsLoading(false)
      }
    },
    [
      id,
      user?.displayName,
      user?.email,
      user?.firstName,
      user?.lastName,
      user?.profile_photo,
    ],
  )

  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchUser()
    }
  }, [isAuthenticated, user, fetchUser])

  useEffect(() => {
    fetchTicket()
  }, [fetchTicket])

  const handleReply = async (message: string, attachments: File[] = []) => {
    setIsReplying(true)
    try {
      let transactionID: string | undefined
      if (attachments.length > 0) {
        // Pass ticket `id` so the transaction is bound to this ticket.
        // Without it, HelpDesk rejects with 409 "Transaction is designated to different ticket".
        transactionID = await helpdeskService.uploadAttachments(attachments, id)
      }

      await helpdeskService.addMessageToTicket(id, message, transactionID)
      await fetchTicket(false) // Re-fetch messages without full skeleton
      toast.success('Message sent successfully')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsReplying(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="mx-auto w-full max-w-188 rounded-3xl bg-(--secondary-40) p-8 md:p-10">
        {isLoading && <ConversationSkeleton />}

        {!isLoading && error && (
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-2">
              <Link
                href="/dashboard/my-tickets"
                className="inline-flex items-center py-1 text-white transition-colors hover:opacity-75"
              >
                <LeftArrowIcon className="size-6" />
              </Link>
              <h2 className="text-[28px] font-semibold text-white">
                Ticket Details
              </h2>
            </div>
            <div className="border-red/30 bg-red/10 rounded-xl border p-6 text-center">
              <p className="text-red text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <TicketConversation
            messages={messages}
            ticketId={orderId}
            shortId={shortId}
            onReply={handleReply}
            isReplying={isReplying}
          />
        )}
      </div>
    </div>
  )
}
