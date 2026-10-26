import type { HelpIssueType, HelpTopic } from '@/lib/services/help.service'

// Where a Help Centre issue type leads: the editor's redirect (e.g. "Other" straight to the
// general ticket form) or its topics page.
export function issueTypeHref(type: Pick<HelpIssueType, 'slug' | 'redirect'>): string {
  return type.redirect || `/help/${type.slug}`
}

// Where a topic leads: its own redirect, or its answers page.
export function topicHref(topic: Pick<HelpTopic, 'slug' | 'redirect'>, categorySlug: string): string {
  return topic.redirect || `/help/${categorySlug}/${topic.slug}`
}

export const GLOBAL_TICKET_PATH = '/help/create-ticket/global'

/**
 * The ticket form, optionally opened on an order (its number) and/or for a topic the customer
 * just read (its slug): the form then picks that order and suggests the matching issue.
 * Topics marked "create ticket global" in Directus go to the general form instead.
 */
export function ticketHref({
  order,
  topic,
  global = false,
}: { order?: string; topic?: string; global?: boolean } = {}): string {
  if (global) return GLOBAL_TICKET_PATH
  const params = new URLSearchParams()
  if (order) params.set('order', order)
  if (topic) params.set('topic', topic)
  const query = params.toString()
  return `/help/create-ticket${query ? `?${query}` : ''}`
}

// The ticket form's issue (Directus `ticket_options`) suggested for a topic's issue type. Only
// a suggestion: the customer can pick another, and nothing is chosen when no option fits.
const ISSUE_FOR_TYPE: Record<string, string> = {
  'product-activation': 'Product key not working',
  payments: 'Payment issue',
}

export function suggestedTicketIssue(issueTypeSlug: string | undefined, options: string[]): string {
  const wanted = issueTypeSlug ? ISSUE_FOR_TYPE[issueTypeSlug] : undefined
  return wanted && options.includes(wanted) ? wanted : ''
}
