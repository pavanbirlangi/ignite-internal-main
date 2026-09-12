import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  wishlistService,
  GetWishlistParams,
} from '@/lib/services/wishlist.service'
import { toast } from 'sonner'

export const useWishlist = (params: GetWishlistParams, enabled = true) => {
  return useQuery({
    queryKey: ['wishlist', params],
    queryFn: () => wishlistService.getWishlist(params),
    enabled,
  })
}

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productId: string) =>
      wishlistService.removeFromWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      queryClient.invalidateQueries({ queryKey: ['wishlist-status'] })
      toast.success('Removed from wishlist')
    },
    onError: (error: any) => {
      console.error('Error removing from wishlist:', error)
      toast.error(
        error?.response?.data?.message || 'Failed to remove from wishlist',
      )
    },
  })
}

export const useAddToWishlist = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productId: string) => wishlistService.addToWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      queryClient.invalidateQueries({ queryKey: ['wishlist-status'] })
      toast.success('Added to wishlist')
    },
    onError: (error: any) => {
      console.error('Error adding to wishlist:', error)
      toast.error(error?.response?.data?.message || 'Failed to add to wishlist')
    },
  })
}

export const useWishlistStatus = (productId: string, enabled = true) => {
  return useQuery({
    queryKey: ['wishlist-status', productId],
    queryFn: () => wishlistService.checkWishlistStatus(productId),
    enabled,
  })
}
