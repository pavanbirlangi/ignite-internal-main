/**
 * Client-side service that calls the server-side HelpDesk proxy routes.
 * This never touches HelpDesk credentials — those live in the API routes.
 */

import type { Ticket, TicketStatus, Message } from '@/types/TicketTypes'

export interface HelpdeskCustomerContext {
  name?: string | null
  avatar?: string | null
}

export interface CreateTicketPayload {
  subject: string
  requesterEmail: string
  requesterName?: string
  message: string
  customFields?: Record<string, string>
  transactionID?: string
}

export interface CreateTicketResult {
  ticketId: string
  shortId: string
}

// ──────────────────── HelpDesk → App type mapping ────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapHDStatus(status: string): TicketStatus {
  switch (status) {
    case 'solved':
      return 'RESOLVED'
    case 'closed':
      return 'REJECTED'
    case 'open':
    case 'pending':
    default:
      return 'UNDER PROCESS'
  }
}

function formatHDDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function formatHDDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    return (
      d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }) +
      ', ' +
      d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    )
  } catch {
    return iso
  }
}

/** Maps a raw HelpDesk ticket object to the app's Ticket interface */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapHDTicketToTicket(raw: any): Ticket {
  const status = mapHDStatus(raw.status ?? 'open')
  const customFields = raw.customFields ?? {}
  const orderId: string =
    customFields.orderId ?? customFields['order-id'] ?? '—'

  return {
    id: raw.ID as string,
    shortId: raw.shortID as string,
    openedOn: formatHDDate(raw.createdAt),
    closedOn:
      status !== 'UNDER PROCESS' && raw.updatedAt
        ? formatHDDate(raw.updatedAt)
        : undefined,
    orderId,
    orderAmount: '—', // HelpDesk doesn't store order amount
    status,
    subject: raw.subject ?? '(No subject)',
    description:
      (raw.events?.[0]?.message?.text as string) ||
      ((raw.events?.[0]?.message?.richTextHtml as string) || '').replace(
        /<[^>]*>?/gm,
        '',
      ) ||
      raw.subject ||
      '',
  }
}

/** Maps an array of HelpDesk event objects to the app's Message[] interface */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapHDEventsToMessages(
  events: any[],
  customer?: HelpdeskCustomerContext,
): Message[] {
  const messages: Message[] = []
  const eventDateMap = new Map<string, string>() // message.id -> raw ISO string

  for (const e of events) {
    if (e.message?.isPrivate) continue

    const isSupport = e.author?.type === 'agent'
    const authorName = (e.author?.name as string) || e.author?.email || ''
    const customerName = customer?.name?.trim() || ''
    const customerAvatar = customer?.avatar?.trim() || ''

    const displayName =
      authorName ||
      (isSupport ? 'Support' : customerName) ||
      (isSupport ? 'Support' : 'You')

    const initialsSource =
      authorName || (!isSupport ? customerName : '') || (isSupport ? 'Support' : 'You')
    const initials =
      initialsSource.charAt(0)?.toUpperCase() || (isSupport ? 'S' : 'U')
      
    const avatar = !isSupport
      ? customerAvatar || e.author?.avatar || undefined
      : e.author?.avatar || undefined

    if (e.type === 'message') {
      const msgData = e.message ?? {}
      let rawText =
        (msgData.text as string) ||
        ((msgData.richTextHtml as string) || '').replace(/<[^>]*>?/gm, '') ||
        '(No content)'

      // Parse structured fields if they exist (e.g. from the create ticket form)
      let title: string | undefined
      let resolutionType: string | undefined
      let description: string | undefined

      if (rawText.includes('Issue Type:') && rawText.includes('Description:')) {
        const issueMatch = rawText.match(/Issue Type:\s*([^\n]+)/)
        const descMatch = rawText.match(/Description:\s*([\s\S]+?)(?=\n\nPreferred Resolution:|\n\nOrder ID:|$)/)
        const resolutionMatch = rawText.match(/Preferred Resolution:\s*([^\n]+)/)

        if (issueMatch) title = issueMatch[1].trim()
        if (descMatch) description = descMatch[1].trim()
        if (resolutionMatch) resolutionType = resolutionMatch[1].trim()

        if (description) {
          rawText = description
        }
      }

      // Base attachments from the message event itself (if any)
      const attachments = Array.isArray(msgData.attachments)
        ? msgData.attachments.map((a: any) => ({
            name: a.name ?? 'attachment',
            url: a.url ?? '#',
            preview: a.url,
          }))
        : []

      const msgId = String(e.ID)
      eventDateMap.set(msgId, e.date)

      messages.push({
        id: msgId,
        sender: { name: displayName, role: isSupport ? 'support' : 'user', initials, avatar },
        timestamp: formatHDDateTime(e.date ?? new Date().toISOString()),
        type: 'message',
        content: {
          text: rawText,
          title,
          resolutionType,
          attachments: attachments.length > 0 ? attachments : undefined,
        },
      })
    } else if (e.type === 'attachments') {
      const newAttachments = e.attachments?.files?.map((a: any) => ({
        name: a.name ?? 'attachment',
        url: a.url ?? '#',
        preview: a.url,
      })) ?? []

      if (newAttachments.length === 0) continue

      // See if we can merge with a message from the SAME role that happened within ~10 seconds
      const currentRole = isSupport ? 'support' : 'user'
      const eTime = new Date(e.date).getTime()

      let merged = false
      for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i]
        const mDateRaw = eventDateMap.get(m.id)
        if (m.sender.role === currentRole && mDateRaw) {
          const mTime = new Date(mDateRaw).getTime()
          if (Math.abs(eTime - mTime) < 10000) { // 10 seconds diff allowed
            m.content.attachments = [
              ...(m.content.attachments ?? []),
              ...newAttachments,
            ]
            merged = true
            break
          }
        }
      }

      if (!merged) {
        // Create standalone message for attachment
        const msgId = String(e.ID)
        eventDateMap.set(msgId, e.date)
        
        messages.push({
          id: msgId,
          sender: { name: displayName, role: currentRole, initials, avatar },
          timestamp: formatHDDateTime(e.date ?? new Date().toISOString()),
          type: 'message',
          content: {
            text: '', // No text
            attachments: newAttachments,
          },
        })
      }
    }
  }

  return messages
}

// ──────────────────── Service ────────────────────

export const helpdeskService = {
  /**
   * Uploads files to HelpDesk via the server-side proxy.
   * Pass `ticketId` when uploading for an existing ticket reply — HelpDesk requires
   * the transaction to be bound to the ticket, otherwise it rejects with 409.
   * Returns a transactionID if upload succeeds, or undefined on failure.
   */
  uploadAttachments: async (files: File[], ticketId?: string): Promise<string | undefined> => {
    if (files.length === 0) return undefined

    try {
      const formData = new FormData()
      for (const file of files) {
        formData.append('file', file, file.name)
      }
      // Bind the upload transaction to an existing ticket when replying
      if (ticketId) {
        formData.append('ticketID', ticketId)
      }

      const response = await fetch('/api/helpdesk/attachments', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        console.error('[helpdeskService] Attachment upload failed:', data)
        return undefined
      }

      const data = await response.json()
      return data.transactionID as string | undefined
    } catch (error) {
      console.error('[helpdeskService] Attachment upload error:', error)
      return undefined
    }
  },


  /**
   * Creates a ticket in HelpDesk via the server-side proxy.
   * Throws on failure so caller can handle errors / show toasts.
   */
  createTicket: async (
    payload: CreateTicketPayload,
  ): Promise<CreateTicketResult> => {
    const response = await fetch('/api/helpdesk/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(
        (data.error as string) ||
          `Failed to create ticket (${response.status})`,
      )
    }

    return response.json() as Promise<CreateTicketResult>
  },

  /**
   * Fetches the list of tickets for a user by their email.
   * Returns mapped Ticket[] (sorted newest first).
   */
  getMyTickets: async (email: string): Promise<Ticket[]> => {
    const response = await fetch(
      `/api/helpdesk/my-tickets?email=${encodeURIComponent(email)}`,
    )

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(
        (data.error as string) ||
          `Failed to fetch tickets (${response.status})`,
      )
    }

    const { tickets } = await response.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (tickets as any[]).map(mapHDTicketToTicket)
  },

  /**
   * Fetches a single ticket (with full events) by its HelpDesk UUID.
   * Returns the raw HelpDesk ticket object so the detail page can map events.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getTicketById: async (
    id: string,
    customer?: HelpdeskCustomerContext,
  ): Promise<{ ticket: any; messages: Message[] }> => {
    const response = await fetch(
      `/api/helpdesk/ticket/${encodeURIComponent(id)}`,
    )

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(
        (data.error as string) || `Failed to fetch ticket (${response.status})`,
      )
    }

    const { ticket } = await response.json()
    const messages = mapHDEventsToMessages(ticket.events ?? [], customer)

    return { ticket, messages }
  },

  /**
   * Adds a message to an existing ticket.
   */
  addMessageToTicket: async (
    ticketId: string,
    message: string,
    transactionID?: string,
  ): Promise<void> => {
    const response = await fetch(`/api/helpdesk/ticket/${encodeURIComponent(ticketId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, transactionID }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(
        (data.error as string) || `Failed to add message (${response.status})`,
      )
    }
  },
}
