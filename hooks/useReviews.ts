import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import { reviewService } from '@/lib/services/review.service'
import type { GetReviewsParams, SubmitReviewPayload } from '@/types/review'

interface UseReviewsParams extends Omit<GetReviewsParams, 'page'> {}

export const useReviews = (params: UseReviewsParams, enabled = true) => {
  return useInfiniteQuery({
    queryKey: ['reviews', params],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      reviewService.getReviews({
        ...params,
        page: pageParam,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    enabled: enabled && Boolean(params.productId),
  })
}

export const useEligibleOrdersForReview = (
  productId: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: ['eligible-review-orders', productId],
    queryFn: () => reviewService.getEligibleOrdersForReview(productId),
    enabled: enabled && Boolean(productId),
  })
}

export const useSubmitReview = () => {
  return useMutation({
    mutationFn: (payload: SubmitReviewPayload) =>
      reviewService.submitReview(payload),
  })
}
