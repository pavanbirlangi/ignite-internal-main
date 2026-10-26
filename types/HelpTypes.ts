import type { CustomerOrderStatus } from '@/lib/orders/order-status'

export interface OrderItem {
  // The order number customers see (#10001).
  id: string
  // Medusa's order id, for the order page link.
  detailId?: string
  products: string
  purchaseDate: string
  image?: string
  total?: string
  status?: CustomerOrderStatus
}

export interface SelectOrderProps {
  orders: OrderItem[]
  onSelectOrder: (order: OrderItem) => void
  isLoading?: boolean
  // The general ticket form, for questions that aren't about an order.
  noOrderHref?: string
}

export interface TicketFormData {
  orderId: string
  issue: string
  description: string
  resolutionType: string
  attachments: File[]
}

export interface CreateTicketFormProps {
  order: OrderItem
  // The help topic the customer read before asking (?topic=): shown, and its issue suggested.
  topic?: { title: string; issueTypeSlug?: string } | null
  // Back to the order list.
  onChangeOrder: () => void
  onSubmit: (data: TicketFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export interface TicketCreatedSuccessProps {
  order?: OrderItem
  ticketId?: string
  shortId?: string
  // My tickets (or the ticket itself); hidden for guests.
  ticketsHref?: string
  helpHref: string
}

export type CreateTicketStep =
  | { view: 'selectOrder' }
  | { view: 'createTicket'; order: OrderItem }
  | { view: 'ticketCreatedSuccess'; order: OrderItem; ticketId?: string; shortId?: string }
