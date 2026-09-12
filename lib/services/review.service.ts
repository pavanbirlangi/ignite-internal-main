import medusaClient from '../medusa-axios'
import type {
  EligibleReviewOrder,
  GetReviewsParams,
  ProductReview,
  ProductReviewsResponse,
  SubmitReviewPayload,
} from '@/types/review'

function mapReview(raw: any): ProductReview {
  return {
    id: raw.id,
    // `reviewer_name` is only ever set on admin-entered/imported reviews with
    // no real order behind them (confirmed live) -- every real customer
    // submission has it as null, same as the old fallback behavior.
    name: raw.reviewer_name || 'Increddy User',
    rating: raw.rating,
    title: raw.title || 'Customer Review',
    body: raw.body || '',
    createdAt: raw.created_at,
    verified: raw.verified_purchase ? 'verified-purchase' : undefined,
    responseBody: raw.response_body ?? null,
  }
}

export const reviewService = {
  getReviews: async (
    params: GetReviewsParams,
  ): Promise<ProductReviewsResponse> => {
    const { data } = await medusaClient.get(
      `/store/products/${params.productId}/reviews`,
      { params: { page: params.page, perPage: params.perPage } },
    )

    const reviews: ProductReview[] = (data.reviews ?? []).map(mapReview)
    const pagination = data.pagination ?? {}

    return {
      reviews,
      summary: {
        averageRating: data.average_rating ?? 0,
        totalReviews: data.count ?? reviews.length,
      },
      page: pagination.page ?? 1,
      perPage: pagination.perPage ?? reviews.length,
      total: data.count ?? reviews.length,
      totalPages: pagination.total_pages ?? 1,
      hasNextPage: Boolean(pagination.has_next_page),
    }
  },

  submitReview: async (payload: SubmitReviewPayload): Promise<void> => {
    await medusaClient.post(`/store/products/${payload.productId}/reviews`, {
      order_id: payload.orderId,
      rating: payload.rating,
      title: payload.title,
      body: payload.body,
    })
  },

  /**
   * Medusa has no guest-review path and no single "orders eligible for
   * review" endpoint -- so this fetches the logged-in customer's own orders
   * (core `GET /store/orders`, confirmed live) and filters to the ones that
   * actually contain this product. Whether a given order has *already* been
   * reviewed isn't checked here (no endpoint for it either); the submit call
   * itself surfaces a clear "already submitted" error if so (confirmed live)
   * -- scoped narrowly to review-submission's own needs rather than building
   * out the general order service, which is Phase 9's job.
   */
  getEligibleOrdersForReview: async (
    productId: string,
  ): Promise<EligibleReviewOrder[]> => {
    const { data } = await medusaClient.get('/store/orders', {
      params: { fields: 'id,display_id,created_at,items.product_id' },
    })

    const orders: any[] = data.orders ?? []
    return orders
      .filter((order) =>
        (order.items ?? []).some((item: any) => item.product_id === productId),
      )
      .map((order) => ({
        id: order.id,
        displayId: order.display_id,
        createdAt: order.created_at,
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
  },
}
