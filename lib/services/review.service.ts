import apiClient from '../axios'
import type {
  GetReviewsParams,
  ProductReview,
  ProductReviewsResponse,
  SubmitReviewPayload,
  SubmitReviewResponse,
} from '@/types/review'

const clampRating = (value: unknown) => {
  const rating = Number(value)

  if (Number.isNaN(rating)) {
    return 0
  }

  return Math.min(5, Math.max(0, rating))
}

const getString = (value: unknown) =>
  typeof value === 'string' ? value : undefined

const getNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const getRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

const normalizeReview = (
  item: unknown,
  index: number,
): ProductReview | null => {
  const record = getRecord(item)

  if (!record) {
    return null
  }

  const rating = clampRating(
    record.rating ?? record.stars ?? record.score ?? record.starRating,
  )

  const body =
    getString(record.body) ??
    getString(record.content) ??
    getString(record.review) ??
    getString(record.description) ??
    ''

  const title =
    getString(record.title) ?? getString(record.heading) ?? 'Customer Review'

  const name =
    getString(record.name) ??
    getString(record.reviewer) ??
    getString(record.author) ??
    'Increddy User'

  if (!body && !title) {
    return null
  }

  const numericId = getNumber(record.id)
  const reviewId =
    getString(record.id) ??
    (numericId !== undefined ? String(numericId) : undefined) ??
    getString(record._id) ??
    `review-${index}`

  return {
    id: reviewId,
    name,
    email: getString(record.email),
    rating,
    title,
    body,
    createdAt:
      getString(record.createdAt) ??
      getString(record.created_at) ??
      getString(record.date) ??
      getString(record.publishedAt),
    verified: getString(record.verified),
    source: getString(record.source),
    helpfulCount: getNumber(record.helpfulCount) ?? 0,
    productTitle: getString(record.productTitle),
    productHandle: getString(record.productHandle),
    profile_photo: getString(record.profile_photo),
    pictures: Array.isArray(record.pictures)
      ? record.pictures.filter(
          (item): item is string => typeof item === 'string',
        )
      : [],
  }
}

const getReviewList = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) {
    return payload
  }

  const record = getRecord(payload)
  if (!record) {
    return []
  }

  const candidates = [record.reviews, record.data, record.items, record.results]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
    }
  }

  return []
}

const normalizeReviewsResponse = (
  payload: unknown,
  params: GetReviewsParams = {},
): ProductReviewsResponse => {
  const reviews = getReviewList(payload)
    .map((item, index) => normalizeReview(item, index))
    .filter((item): item is ProductReview => Boolean(item))

  const record = getRecord(payload)
  const pagination = getRecord(record?.pagination)
  const meta = getRecord(record?.meta)
  const summary = getRecord(record?.summary) ?? getRecord(record?.stats)

  const averageFromPayload = Number(
    summary?.averageRating ??
      summary?.average ??
      record?.averageRating ??
      record?.average,
  )

  const totalFromPayload = Number(
    summary?.totalReviews ??
      summary?.count ??
      pagination?.total ??
      meta?.total ??
      record?.total,
  )

  const derivedAverage = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0

  const page = Number(pagination?.page ?? meta?.page ?? params.page ?? 1)
  const perPage = Number(
    pagination?.perPage ??
      meta?.perPage ??
      params.perPage ??
      reviews.length ??
      10,
  )
  const totalPagesFromPayload = Number(
    pagination?.totalPages ?? meta?.totalPages ?? record?.totalPages,
  )
  const totalReviews =
    Number.isFinite(totalFromPayload) && totalFromPayload > 0
      ? totalFromPayload
      : reviews.length
  const totalPages =
    Number.isFinite(totalPagesFromPayload) && totalPagesFromPayload > 0
      ? totalPagesFromPayload
      : Math.max(1, Math.ceil(totalReviews / Math.max(perPage, 1)))

  return {
    reviews,
    summary: {
      averageRating:
        Number.isFinite(averageFromPayload) && averageFromPayload > 0
          ? averageFromPayload
          : derivedAverage,
      totalReviews,
    },
    page,
    perPage,
    total: totalReviews,
    totalPages,
    hasNextPage: Boolean(pagination?.hasNextPage) || page < totalPages,
  }
}

export const reviewService = {
  getReviews: async (
    params: GetReviewsParams = {},
  ): Promise<ProductReviewsResponse> => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(
        ([_, value]) => value !== undefined && value !== '',
      ),
    )

    const response = await apiClient.get('/reviews', {
      params: cleanParams,
    })

    return normalizeReviewsResponse(response.data, params)
  },

  submitReview: async (
    payload: SubmitReviewPayload,
  ): Promise<SubmitReviewResponse> => {
    const response = await apiClient.post<SubmitReviewResponse>(
      '/reviews',
      payload,
    )
    return response.data
  },
}
