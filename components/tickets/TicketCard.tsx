import { cn } from '@/lib/utils'
import type { TicketCardProps, TicketStatus } from '@/types/TicketTypes'
import {
  ACCOUNT_CARD_CLASS,
  ACCOUNT_SECONDARY_BUTTON_CLASS,
  MetaItem,
  StatusPill,
  type StatusTone,
} from '@/components/library/account-ui'

const statusTone: Record<TicketStatus, StatusTone> = {
  'UNDER PROCESS': 'warning',
  REJECTED: 'danger',
  RESOLVED: 'success',
}

const statusLabel: Record<TicketStatus, string> = {
  'UNDER PROCESS': 'Under process',
  REJECTED: 'Rejected',
  RESOLVED: 'Resolved',
}

export function TicketCard({ ticket, onViewDetails }: TicketCardProps) {
  return (
    <div className={cn(ACCOUNT_CARD_CLASS, 'px-4 py-4 sm:px-5')}>
      {/* Top row: ticket facts and status */}
      <div className="mb-4 flex flex-col-reverse items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <MetaItem label="Opened On" value={ticket.openedOn} />
          {ticket.closedOn && <MetaItem label="Closed On" value={ticket.closedOn} />}
          <MetaItem label="Order ID" value={ticket.orderId} />
          {ticket.shortId && <MetaItem label="Ticket ID" value={`#${ticket.shortId}`} />}
        </div>
        <StatusPill tone={statusTone[ticket.status]}>{statusLabel[ticket.status]}</StatusPill>
      </div>

      <div className="bg-border mb-4 h-px w-full" />

      {/* Subject and action */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-white/95">{ticket.subject}</h3>
          {ticket.description && ticket.description !== ticket.subject && (
            <p className="mt-1 line-clamp-2 max-w-xl text-sm! leading-5! text-white/65">
              {ticket.description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onViewDetails?.(ticket.id)}
          className={cn(ACCOUNT_SECONDARY_BUTTON_CLASS, 'w-full shrink-0 md:w-auto')}
        >
          View Details
        </button>
      </div>
    </div>
  )
}
