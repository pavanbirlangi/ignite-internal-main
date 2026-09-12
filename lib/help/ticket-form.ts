import type { TicketFormData } from '@/types/HelpTypes'

export const MAX_TICKET_ATTACHMENTS = 5
export const MAX_TICKET_ATTACHMENT_SIZE_BYTES = 2 * 1024 * 1024

export const ISSUE_OPTIONS = [
  'Product key not working',
  'Wrong product received',
  'Payment issue',
  'Refund request',
  'Other',
] as const

export const RESOLUTION_OPTIONS = [
  'Replacement key',
  'Refund',
  'Store credit',
  'Other',
] as const

export function getValidAttachments(
  files: FileList | File[] | null | undefined,
) {
  return Array.from(files ?? []).filter(
    (file) => file.size <= MAX_TICKET_ATTACHMENT_SIZE_BYTES,
  )
}

export function mergeAttachments(
  currentAttachments: File[],
  nextAttachments: File[],
) {
  return [...currentAttachments, ...nextAttachments].slice(
    0,
    MAX_TICKET_ATTACHMENTS,
  )
}

export function createTicketFormPayload(
  orderId: string,
  issue: string,
  description: string,
  resolutionType: string,
  attachments: File[],
): TicketFormData {
  return {
    orderId,
    issue,
    description,
    resolutionType,
    attachments,
  }
}
