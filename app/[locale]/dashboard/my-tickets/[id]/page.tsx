'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { TicketConversation } from '@/components/tickets/TicketConversation'
import { helpdeskService, mapHDTicketToTicket } from '@/lib/services/helpdesk.service'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { Message, TicketStatus } from '@/types/TicketTypes'
import { useUserStore } from '@/store/useUserStore'
import { toast } from 'sonner'

interface TicketDetailsPageProps {
  params: Promise<{ id: string }>
}

function ConversationSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="bg-secondary h-4 w-24 rounded" />
      <div className="bg-secondary h-9 w-56 rounded-lg" />
      <div className="bg-card border-border mt-2 h-24 rounded-xl border" />
      <div className="bg-secondary ml-auto h-12 w-2/5 rounded-2xl" />
      <div className="bg-secondary h-12 w-1/2 rounded-2xl" />
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
  const [status, setStatus] = useState<TicketStatus | undefined>()
  const [openedOn, setOpenedOn] = useState<string>('')
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

        setMessages(msgs)
        const customFields = ticket.customFields ?? {}
        setOrderId(
          customFields.orderId ??
            customFields['order-id'] ??
            ticket.shortID ??
            id,
        )
        setShortId(ticket.shortID ?? '')
        const summary = mapHDTicketToTicket(ticket)
        setStatus(summary.status)
        setOpenedOn(summary.openedOn)
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
      <div className="w-full">
        {isLoading && <ConversationSkeleton />}

        {!isLoading && error && (
          <div className="flex flex-col gap-6">
            <Link
              href="/dashboard/my-tickets"
              className="inline-flex w-fit items-center gap-1 text-sm text-white/65 transition-colors hover:text-white"
            >
              <ChevronLeft className="size-4" />
              My Tickets
            </Link>
            <h1 className="text-3xl font-bold">Ticket Details</h1>
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
            status={status}
            openedOn={openedOn}
            onReply={handleReply}
            isReplying={isReplying}
          />
        )}
      </div>
    </div>
  )
}
