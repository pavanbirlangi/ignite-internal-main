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
   * `GET /store/products/:id/review-eligibility` -- customer-authenticated,
   * added to the backend specifically to close this gap (was previously a
   * client-side filter over the customer's full order history, with
   * "already reviewed" only discovered late via the submit call's rejection
   * -- see the requirements doc's R-14 for the before/after). Confirmed
   * live the route returns orders in whatever order `query.graph` happened
   * to return them (not sorted), so the most-recent-first sort still
   * happens client-side here, same as before.
   */
  getEligibleOrdersForReview: async (
    productId: string,
  ): Promise<EligibleReviewOrder[]> => {
    const { data } = await medusaClient.get(
      `/store/products/${encodeURIComponent(productId)}/review-eligibility`,
    )

    const orders: any[] = data.orders ?? []
    return orders
      .map((order) => ({
        id: order.order_id,
        displayId: Number(order.order_display_id) || 0,
        createdAt: order.purchased_at,
        alreadyReviewed: Boolean(order.already_reviewed),
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
  },
}
