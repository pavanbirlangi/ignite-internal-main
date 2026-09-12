import { useInfiniteQuery } from '@tanstack/react-query'
import { reviewService } from '@/lib/services/review.service'
import type { GetReviewsParams } from '@/types/review'

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
    enabled: enabled && Boolean(params.handle || params.productId),
  })
}
