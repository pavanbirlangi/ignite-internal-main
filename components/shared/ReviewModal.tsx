'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { VisuallyHidden } from 'radix-ui'
import { XIcon, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useEligibleOrdersForReview, useSubmitReview } from '@/hooks/useReviews'
import { useUserStore } from '@/store/useUserStore'
import { useAuthModalStore } from '@/store/useAuthModalStore'
import { Product } from '@/types/product'
import { getProxyImageUrl } from '@/lib/utils'
import { extractApiErrorMessage } from '@/lib/utils/api-error'

export function ReviewModal({
  children,
  open,
  onOpenChange,
  product,
  onSubmitted,
}: {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  product: Product
  onSubmitted?: () => Promise<unknown> | unknown
}) {
  const user = useUserStore((state) => state.user)
  const isAuthenticated = useUserStore((state) => state.isAuthenticated)
  const openAuthModal = useAuthModalStore((state) => state.openModal)

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const profilePhoto = user?.profile_photo?.trim() || ''
  const avatarFallback =
    [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('') || 'N'

  // Medusa has no guest-review path -- a customer must be logged in and must
  // have a real order containing this product (confirmed live: submitting
  // without one is rejected outright). Only fetch once the modal is
  // actually open, not on every mount.
  const { data: eligibleOrders, isLoading: isLoadingOrders } =
    useEligibleOrdersForReview(product.id, Boolean(open) && isAuthenticated)
  const { mutateAsync: submitReview, isPending: isSubmitting } =
    useSubmitReview()

  // Defaults to the most recent eligible order until the user picks a
  // different one -- derived rather than synced via an effect.
  const effectiveOrderId = selectedOrderId || eligibleOrders?.[0]?.id || ''

  const closeModal = () => {
    onOpenChange?.(false)
  }

  const resetForm = () => {
    setRating(0)
    setHoverRating(0)
    setReviewText('')
    setSelectedOrderId('')
  }

  const buildReviewTitle = (text: string) => {
    const normalized = text.trim().replace(/\s+/g, ' ')
    if (!normalized) return 'Customer Review'
    return normalized.length > 60 ? `${normalized.slice(0, 60)}...` : normalized
  }

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      openAuthModal('login')
      return
    }

    if (!effectiveOrderId) {
      toast.error('You need to have purchased this product to review it')
      return
    }

    if (!rating) {
      toast.error('Please select a rating')
      return
    }

    const body = reviewText.trim()
    if (!body) {
      toast.error('Please write your review before posting')
      return
    }

    try {
      await submitReview({
        productId: product.id,
        orderId: effectiveOrderId,
        rating,
        title: buildReviewTitle(body),
        body,
      })

      toast.success(
        'Review posted -- it will appear once our team approves it',
      )
      await onSubmitted?.()
      resetForm()
      closeModal()
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Failed to post review'))
    }
  }

  const handleCancel = () => {
    resetForm()
    closeModal()
  }

  const hasEligibleOrders = Boolean(eligibleOrders?.length)
  const canWriteReview = isAuthenticated && hasEligibleOrders

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        showCloseButton={false}
        className="no-scrollbar bg-secondary/40 flex max-h-[82dvh] flex-col items-center justify-start gap-6 overflow-y-auto border-none p-6 shadow-2xl backdrop-blur-2xl sm:max-h-[90dvh] sm:max-w-3xl sm:gap-7 sm:rounded-3xl sm:p-7"
      >
        <VisuallyHidden.Root>
          <DialogTitle>Rate and Review</DialogTitle>
        </VisuallyHidden.Root>
        <div className="flex w-full max-w-full flex-col gap-5 sm:gap-6">
          {/* Header Area */}
          <div className="border-secondary flex w-full flex-col items-center justify-center gap-3 border-b pb-4 sm:gap-4 sm:pb-5">
            <div className="relative flex h-20 w-full items-center justify-center">
              {/* Avatar */}
              <div className="bg-primary relative flex h-18 w-18 items-center justify-center overflow-hidden rounded-full text-[32px] font-semibold text-white shadow-lg">
                {profilePhoto ? (
                  <Image
                    src={getProxyImageUrl(profilePhoto)}
                    alt={user?.displayName || 'User profile photo'}
                    fill
                    sizes="72px"
                    className="object-cover"
                  />
                ) : (
                  <span>{avatarFallback}</span>
                )}
              </div>

              {/* Close Button */}
              <DialogClose className="absolute top-0 right-0 flex h-7 w-7 items-center justify-center text-white transition-colors hover:border-white hover:bg-white/10">
                <XIcon
                  className="text-muted-foreground size-5"
                  strokeWidth={2.5}
                />
              </DialogClose>
            </div>

            <div className="flex flex-col items-center justify-center gap-3">
              <h2 className="text-[22px] leading-7 font-semibold text-white">
                Rate & Review
              </h2>
              <p className="text-muted-foreground max-w-150 text-center text-[15px] leading-5 font-medium">
                Help your fellow gamers & guide them to the true treasure by
                sharing your truest experience & opinions.
              </p>
            </div>

            {/* Star Rating Interactive */}
            <div className="mt-1 flex items-center gap-2 sm:mt-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= (hoverRating || rating)
                return (
                  <div
                    key={star}
                    className={`transition-transform ${canWriteReview ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed opacity-50'}`}
                    onMouseEnter={() => canWriteReview && setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => canWriteReview && setRating(star)}
                  >
                    <Star
                      size={40}
                      fill={isFilled ? 'var(--accent)' : 'transparent'}
                      className={isFilled ? 'text-accent' : 'text-accent'}
                      strokeWidth={1.5}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="bg-secondary flex flex-col items-center gap-3 rounded-[12px] p-6 text-center">
              <p className="text-white">
                Please log in to write a review for this product.
              </p>
              <button
                onClick={() => openAuthModal('login')}
                className="bg-primary hover:bg-primary rounded-[6px] px-6 py-2.5 text-[15px] font-semibold text-white transition-transform active:scale-[0.98]"
              >
                Log In
              </button>
            </div>
          ) : isLoadingOrders ? (
            <div className="bg-secondary rounded-[12px] p-6 text-center text-sm text-white">
              Checking your orders...
            </div>
          ) : !hasEligibleOrders ? (
            <div className="bg-secondary rounded-[12px] p-6 text-center text-white">
              You need to have purchased this product to leave a review.
            </div>
          ) : (
            <>
              {eligibleOrders && eligibleOrders.length > 1 && (
                <div className="flex w-full flex-col gap-2">
                  <span className="text-muted-foreground text-sm font-medium">
                    Which order is this review for?
                  </span>
                  <Select
                    value={effectiveOrderId}
                    onValueChange={setSelectedOrderId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an order" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleOrders.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          Order #{order.displayId} --{' '}
                          {new Date(order.createdAt).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Text Area */}
              <div className="flex w-full flex-col gap-2">
                <div className="bg-secondary h-36 w-full rounded-[12px] p-4 sm:h-40">
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Write your review in details here"
                    className="placeholder:text-muted-foreground h-full w-full resize-none bg-transparent text-[16px] leading-5.5 font-medium text-white outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="flex w-full items-center justify-between gap-4 sm:gap-5">
            {canWriteReview && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary flex h-12 flex-1 items-center justify-center rounded-[6px] text-[16px] leading-6 font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-50 sm:h-13 sm:px-9 sm:py-4 sm:text-[18px]"
              >
                {isSubmitting ? 'Posting...' : 'Post Review'}
              </button>
            )}
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="border-muted-foreground flex h-12 flex-1 items-center justify-center rounded-[6px] border bg-transparent text-[16px] leading-6 font-semibold text-white transition-transform hover:bg-white/5 active:scale-[0.98] sm:h-13 sm:p-4 sm:text-[18px]"
            >
              {canWriteReview ? 'Cancel' : 'Close'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
