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
import { XIcon, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useEligibleOrdersForReview, useSubmitReview } from '@/hooks/useReviews'
import { useUserStore } from '@/store/useUserStore'
import { useAuthModalStore } from '@/store/useAuthModalStore'
import { Product } from '@/types/product'
import { cn, getProxyImageUrl } from '@/lib/utils'
import {
  ACCOUNT_PRIMARY_BUTTON_CLASS,
  ACCOUNT_SECTION_LABEL_CLASS,
  ACCOUNT_TEXT_BUTTON_CLASS,
} from '@/components/library/account-ui'
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
  const isAuthenticated = useUserStore((state) => state.isAuthenticated)
  const openAuthModal = useAuthModalStore((state) => state.openModal)

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState('')

  // Medusa has no guest-review path -- a customer must be logged in and must
  // have a real order containing this product (confirmed live: submitting
  // without one is rejected outright). Only fetch once the modal is
  // actually open, not on every mount.
  const { data: eligibleOrders, isLoading: isLoadingOrders } =
    useEligibleOrdersForReview(product.id, Boolean(open) && isAuthenticated)
  const { mutateAsync: submitReview, isPending: isSubmitting } =
    useSubmitReview()

  // The backend now flags per-order whether it's already been reviewed
  // (previously only discoverable late, via the submit call's rejection) --
  // the default selection should skip straight past those rather than
  // landing on one that's guaranteed to fail.
  const reviewableOrders = eligibleOrders?.filter((o) => !o.alreadyReviewed)

  // Defaults to the most recent reviewable order until the user picks a
  // different one -- derived rather than synced via an effect.
  const effectiveOrderId = selectedOrderId || reviewableOrders?.[0]?.id || ''

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

      toast.success("Thanks for your review! It will appear on this page once it's approved.")
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

  const hasAnyOrders = Boolean(eligibleOrders?.length)
  const hasReviewableOrders = Boolean(reviewableOrders?.length)
  const canWriteReview = isAuthenticated && hasReviewableOrders

  const activeRating = hoverRating || rating
  const selectedOrder = eligibleOrders?.find((order) => order.id === effectiveOrderId)
  const imageUrl = getProxyImageUrl(product.featuredImage?.url)
  const noticeClass =
    'bg-background border-border rounded-xl border p-5 text-center text-sm text-white/65'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="no-scrollbar bg-card border-border flex max-h-[90dvh] w-full flex-col gap-0 overflow-y-auto rounded-2xl border p-0 text-white/95 shadow-2xl sm:max-w-140"
      >
        <div className="border-border flex items-center justify-between border-b py-4 pr-5 pl-6">
          <DialogTitle className="text-xl font-bold">Rate &amp; review</DialogTitle>
          <DialogClose
            aria-label="Close"
            className="grid size-9 cursor-pointer place-items-center rounded-full bg-white/5 text-white/65 transition-colors outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <XIcon className="size-4.5" />
          </DialogClose>
        </div>

        <div className="flex flex-col gap-5 p-6">
          {/* The product being reviewed */}
          <div className="flex items-center gap-3.5">
            {imageUrl && (
              <div className="bg-secondary relative h-16 w-12 shrink-0 overflow-hidden rounded-md">
                <Image src={imageUrl} alt="" fill sizes="48px" className="object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <p className="line-clamp-2 text-base font-bold text-white/95">{product.title}</p>
              {selectedOrder && eligibleOrders?.length === 1 && (
                <p className="mt-0.5 text-xs! leading-4! text-white/65">
                  Bought in order #{selectedOrder.displayId} · {formatOrderDay(selectedOrder.createdAt)}
                </p>
              )}
            </div>
          </div>

          {!isAuthenticated ? (
            <div className={noticeClass}>
              <p className="text-white/95">Please log in to write a review for this product.</p>
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className={cn(ACCOUNT_PRIMARY_BUTTON_CLASS, 'mt-3')}
              >
                Log In
              </button>
            </div>
          ) : isLoadingOrders ? (
            <div className={noticeClass}>Checking your orders...</div>
          ) : !hasAnyOrders ? (
            <div className={noticeClass}>
              You need to have purchased this product to leave a review.
            </div>
          ) : !hasReviewableOrders ? (
            <div className={noticeClass}>
              You&apos;ve already reviewed this product for every eligible order.
            </div>
          ) : (
            <>
              {/* Stars, with a word for the score */}
              <div className="bg-background border-border rounded-xl border p-4 text-center">
                <div
                  className="flex justify-center gap-1.5"
                  role="radiogroup"
                  aria-label="Rating"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= activeRating
                    return (
                      <button
                        key={star}
                        type="button"
                        role="radio"
                        aria-checked={rating === star}
                        aria-label={`${star} of 5: ${RATING_LABELS[star - 1]}`}
                        onMouseEnter={() => setHoverRating(star)}
                        onClick={() => setRating(star)}
                        className="cursor-pointer rounded-md transition-transform outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-white/40 motion-reduce:transition-none"
                      >
                        <Star
                          className={cn(
                            'size-9',
                            isFilled ? 'fill-[#F5A524] text-[#F5A524]' : 'text-white/30',
                          )}
                          strokeWidth={1.5}
                        />
                      </button>
                    )
                  })}
                </div>
                <p
                  className={cn(
                    'mt-1.5 text-sm! leading-5! font-medium',
                    activeRating ? 'text-white/95' : 'text-white/65',
                  )}
                >
                  {activeRating ? RATING_LABELS[activeRating - 1] : 'Tap a star to rate'}
                </p>
              </div>

              {eligibleOrders && eligibleOrders.length > 1 && (
                <div className="flex w-full flex-col gap-2">
                  <span className={ACCOUNT_SECTION_LABEL_CLASS}>Order</span>
                  <Select value={effectiveOrderId} onValueChange={setSelectedOrderId}>
                    <SelectTrigger className="bg-background border-border h-11! w-full rounded-lg text-sm! font-medium text-white/95 hover:border-white/20">
                      <SelectValue placeholder="Select an order" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border rounded-xl p-1">
                      {eligibleOrders.map((order) => (
                        <SelectItem
                          key={order.id}
                          value={order.id}
                          disabled={order.alreadyReviewed}
                          className="h-10 cursor-pointer rounded-lg text-sm font-medium text-white/65 focus:bg-white/8 focus:text-white data-[state=checked]:text-white [&_svg]:text-white!"
                        >
                          Order #{order.displayId} · {formatOrderDay(order.createdAt)}
                          {order.alreadyReviewed ? ' (already reviewed)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex w-full flex-col gap-2">
                <label htmlFor="review-text" className={ACCOUNT_SECTION_LABEL_CLASS}>
                  Your review
                </label>
                <textarea
                  id="review-text"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell other gamers what you liked, how the key worked and anything to watch out for"
                  className="bg-background border-border h-32 w-full resize-none rounded-lg border p-3 text-sm text-white/95 transition-colors outline-none placeholder:text-white/45 hover:border-white/20 focus:border-primary/70"
                />
              </div>
            </>
          )}
        </div>

        <div className="border-border flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className={cn(ACCOUNT_TEXT_BUTTON_CLASS, 'h-11 justify-center px-4')}
          >
            {canWriteReview ? 'Cancel' : 'Close'}
          </button>
          {canWriteReview && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              aria-busy={isSubmitting || undefined}
              className={cn(ACCOUNT_PRIMARY_BUTTON_CLASS, 'h-11 px-5')}
            >
              {isSubmitting ? 'Posting...' : 'Post review'}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent']

// "14 Oct 2026"
function formatOrderDay(iso: string) {
  const date = new Date(iso)
  return isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
