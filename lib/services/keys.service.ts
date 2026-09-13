import medusaClient from '../medusa-axios'

export type KeyAssignmentStatus = 'pending_manual' | 'assigned' | 'revealed' | 'refunded'

export interface KeyAssignment {
  id: string
  status: KeyAssignmentStatus
  key: string | null
  variantId: string
  productId: string
  assignedAt: string | null
  revealedAt: string | null
}

function mapKeyAssignment(raw: any): KeyAssignment {
  return {
    id: raw.id,
    status: raw.status,
    key: raw.key,
    variantId: raw.variant_id,
    productId: raw.product_id,
    assignedAt: raw.assigned_at,
    revealedAt: raw.revealed_at,
  }
}

export const keysService = {
  /**
   * `GET /store/orders/:id/key` -- session-authenticated, ownership checked
   * server-side, no email param needed at all (confirmed live; the old
   * email-based lookup this replaces was calling a dead endpoint). Fetching
   * this route *is* the reveal action -- the backend workflow is literally
   * named `reveal-license-key`, there's no separate reveal call.
   */
  getOrderKeys: async (orderId: string): Promise<KeyAssignment[]> => {
    const { data } = await medusaClient.get(
      `/store/orders/${encodeURIComponent(orderId)}/key`,
    )
    return (data.keys ?? []).map(mapKeyAssignment)
  },
}
