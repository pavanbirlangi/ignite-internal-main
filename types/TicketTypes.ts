export type TicketStatus = 'UNDER PROCESS' | 'REJECTED' | 'RESOLVED'

export interface Ticket {
  id: string // HelpDesk UUID — used for detail page navigation
  shortId?: string // HelpDesk short ID e.g. "IIPZGJ" — displayed in UI
  openedOn: string
  closedOn?: string
  orderId: string
  orderAmount: string
  status: TicketStatus
  subject: string
  description: string
}

export interface TicketCardProps {
  ticket: Ticket
  onViewDetails?: (id: string) => void
}

export interface TicketMessageAttachment {
  name: string
  url: string
  preview?: string
}

export interface TicketMessageSender {
  name: string
  role: 'user' | 'support'
  avatar?: string
  initials?: string
}

export interface TicketMessageContent {
  title?: string
  text: string
  resolutionType?: string
  attachments?: TicketMessageAttachment[]
}

export interface Message {
  id: string
  sender: TicketMessageSender
  timestamp: string
  content: TicketMessageContent
  type: 'message' | 'status_update'
  status?: TicketStatus
}

export interface TicketConversationProps {
  messages: Message[]
  ticketId: string // Used currently for orderId
  shortId?: string // The generated ticket short ID
  onReply?: (message: string, attachments?: File[]) => Promise<void>
  isReplying?: boolean
}
