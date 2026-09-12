import type { ReactNode } from 'react'

export interface OrderItem {
  id: string
  products: string
  purchaseDate: string
  image?: string
}

export interface IssueCategory {
  id: string
  title: string
  description: string
  icon: ReactNode | string
  redirect?: string | null
  createTicketGlobal?: boolean
}

export interface SelectOrderProps {
  orders: OrderItem[]
  onBack?: () => void
  onSelectOrder: (order: OrderItem) => void
  isLoading?: boolean
}

export interface ChooseIssueTypeProps {
  categories: IssueCategory[]
  onSelectCategory: (category: IssueCategory) => void
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
  onBack: () => void
  onSubmit: (data: TicketFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export interface TicketCreatedSuccessProps {
  order: OrderItem
  ticketId?: string
  shortId?: string
  onViewDetails: () => void
}

export type CreateTicketStep =
  | { view: 'selectOrder' }
  | { view: 'createTicket'; order: OrderItem }
  | { view: 'ticketCreatedSuccess'; order: OrderItem; ticketId?: string; shortId?: string }
