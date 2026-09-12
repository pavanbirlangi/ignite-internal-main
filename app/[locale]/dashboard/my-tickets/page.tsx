'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { TicketCard } from '@/components/tickets/TicketCard'
import { helpdeskService } from '@/lib/services/helpdesk.service'
import { useUserStore } from '@/store/useUserStore'
import type { Ticket } from '@/types/TicketTypes'

function TicketListSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="border-border bg-secondary h-48 animate-pulse rounded-[12px] border"
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
    <div className="bg-secondary/40 flex flex-col gap-8 rounded-[20px] p-4 sm:p-10">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl md:text-[28px] font-semibold">Track Tickets</h1>
        <p className="text-muted-foreground text-sm font-medium">
          Track your opened &amp; closed tickets
        </p>
      </div>

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
            className="bg-secondary hover:bg-border mt-4 cursor-pointer rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* No user */}
      {!isLoading && !error && !user?.email && (
        <p className="text-muted-foreground text-sm">
          Please log in to view your tickets.
        </p>
      )}

      {/* Empty */}
      {!isLoading && !error && user?.email && tickets.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-muted-foreground text-sm">
            You haven&apos;t raised any support tickets yet.
          </p>
        </div>
      )}

      {/* Ticket List */}
      {!isLoading && !error && tickets.length > 0 && (
        <div className="flex flex-col gap-6">
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
