'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { TicketCard } from '@/components/tickets/TicketCard'
import { helpdeskService } from '@/lib/services/helpdesk.service'
import { useUserStore } from '@/store/useUserStore'
import type { Ticket } from '@/types/TicketTypes'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  ACCOUNT_CARD_CLASS,
  ACCOUNT_PRIMARY_BUTTON_CLASS,
  ACCOUNT_SECONDARY_BUTTON_CLASS,
  AccountPageHeader,
} from '@/components/library/account-ui'

function TicketListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-card border-border h-40 animate-pulse rounded-xl border"
        />
      ))}
    </div>
  )
}

export default function MyTicketsPage() {
  const router = useRouter()
  const user = useUserStore((s) => s.user)

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.email) return

    let cancelled = false

    const fetchTickets = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await helpdeskService.getMyTickets(user.email)
        if (!cancelled) setTickets(data)
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof Error ? err.message : 'Failed to load tickets'
          setError(msg)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchTickets()
    return () => {
      cancelled = true
    }
  }, [user?.email])

  const handleViewDetails = (id: string) => {
    // id is the HelpDesk UUID — used as the URL param for the detail page
    router.push(`/dashboard/my-tickets/${id}`)
  }

  return (
    <div>
      <AccountPageHeader
        title="My Tickets"
        subtitle="Track your opened & closed tickets"
        action={
          <Link href="/help" className={ACCOUNT_PRIMARY_BUTTON_CLASS}>
            New ticket
          </Link>
        }
      />

      {/* Loading */}
      {isLoading && <TicketListSkeleton />}

      {/* Error */}
      {!isLoading && error && (
        <div className="border-red/30 bg-red/10 rounded-xl border p-6 text-center">
          <p className="text-red text-sm font-medium">{error}</p>
          <button
            onClick={() => {
              if (user?.email) {
                setIsLoading(true)
                helpdeskService
                  .getMyTickets(user.email)
                  .then(setTickets)
                  .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
                  .finally(() => setIsLoading(false))
              }
            }}
            className={cn(ACCOUNT_SECONDARY_BUTTON_CLASS, 'mt-4')}
          >
            Retry
          </button>
        </div>
      )}

      {/* No user */}
      {!isLoading && !error && !user?.email && (
        <p className="text-white/65 text-sm">
          Please log in to view your tickets.
        </p>
      )}

      {/* Empty */}
      {!isLoading && !error && user?.email && tickets.length === 0 && (
        <div className={cn(ACCOUNT_CARD_CLASS, 'px-6 py-14 text-center')}>
          <p className="text-sm text-white/65">
            You haven&apos;t raised any support tickets yet.
          </p>
        </div>
      )}

      {/* Ticket List */}
      {!isLoading && !error && tickets.length > 0 && (
        <div className="flex flex-col gap-3">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  )
}
