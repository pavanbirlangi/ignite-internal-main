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
import { VisuallyHidden } from 'radix-ui'
import { XIcon, Star } from 'lucide-react'
import { toast } from 'sonner'
import { reviewService } from '@/lib/services/review.service'
import { useUserStore } from '@/store/useUserStore'
import { Product } from '@/types/product'
import { getProxyImageUrl } from '@/lib/utils'

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

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const profilePhoto = user?.profile_photo?.trim() || ''
  const avatarFallback =
    [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('') || 'N'

  const closeModal = () => {
    onOpenChange?.(false)
  }

  const resetForm = () => {
    setRating(0)
    setHoverRating(0)
    setReviewText('')
  }

  const buildReviewTitle = (text: string) => {
    const normalized = text.trim().replace(/\s+/g, ' ')
    if (!normalized) return 'Customer Review'
    return normalized.length > 60 ? `${normalized.slice(0, 60)}...` : normalized
  }

  const handleSubmit = async () => {
    if (!product?.handle) {
      toast.error('Product handle is missing for this review')
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

    const name =
      [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
      'Customer'
    const email = user?.email || 'customer@increddy.local'

    setIsSubmitting(true)
    try {
      await reviewService.submitReview({
        handle: product.handle,
        productHandle: product.handle,
        id: product.id,
        productId: product.id,
        name,
        email,
        rating,
        title: buildReviewTitle(body),
        body,
      })

      toast.success('Review posted successfully')
      await onSubmitted?.()
      resetForm()
      closeModal()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to post review')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    resetForm()
    closeModal()
  }

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
                    className="cursor-pointer transition-transform hover:scale-110"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
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

          {/* Footer Actions */}
          <div className="flex w-full items-center justify-between gap-4 sm:gap-5">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary flex h-12 flex-1 items-center justify-center rounded-[6px] text-[16px] leading-6 font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-50 sm:h-13 sm:px-9 sm:py-4 sm:text-[18px]"
            >
              {isSubmitting ? 'Posting...' : 'Post Review'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="border-muted-foreground flex h-12 flex-1 items-center justify-center rounded-[6px] border bg-transparent text-[16px] leading-6 font-semibold text-white transition-transform hover:bg-white/5 active:scale-[0.98] sm:h-13 sm:p-4 sm:text-[18px]"
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
