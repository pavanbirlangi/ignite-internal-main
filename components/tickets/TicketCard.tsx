import { cn } from '@/lib/utils'
import type { TicketCardProps, TicketStatus } from '@/types/TicketTypes'

const statusStyles: Record<TicketStatus, string> = {
  'UNDER PROCESS': 'bg-accent text-white',
  REJECTED: 'bg-red text-white',
  RESOLVED: 'bg-destructive text-white',
}

export function TicketCard({ ticket, onViewDetails }: TicketCardProps) {
  return (
    <div className="bg-secondary glassmorphism border-border flex flex-col gap-6 rounded-[12px] border px-3 py-3 sm:px-6 md:flex-row md:items-start md:justify-between">
      <div className="flex-1 space-y-6">
        <div className="flex items-start justify-between sm:items-center">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 md:gap-x-12">
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Opened On
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {ticket.openedOn}
              </p>
            </div>

            {ticket.closedOn && (
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  Closed On
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {ticket.closedOn}
                </p>
              </div>
            )}

            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Order ID
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {ticket.orderId}
              </p>
            </div>

            {ticket.shortId && (
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  Ticket ID
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  #{ticket.shortId}
                </p>
              </div>
            )}
          </div>
          <div
            className={cn(
              'rounded-lg px-3 py-2 text-sm text-[12px] font-semibold tracking-wide text-nowrap uppercase',
              statusStyles[ticket.status],
            )}
          >
            {ticket.status}
          </div>
        </div>
        {/* Divider */}
        <div className="bg-muted-foreground h-px w-full" />

        {/* Content */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {ticket.subject}
            </h3>
            <p className="text-muted-foreground mt-2 line-clamp-2 max-w-63.75 text-xs font-medium">
              {ticket.description}
            </p>
          </div>
          <div className="mt-4 md:mt-0 md:self-center">
            <button
              onClick={() => onViewDetails?.(ticket.id)}
              className="border-muted-foreground cursor-pointer rounded-[7px] border bg-transparent px-6 py-3 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:border-white/40 hover:bg-white/5"
            >
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* Action Button */}
    </div>
  )
}
