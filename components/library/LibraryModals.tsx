import type { LibraryItem } from '@/types/library'
import type { Product } from '@/types/product'
import { RevealProductModal } from '@/components/library/RevealProductModal'
import { ReviewModal } from '@/components/shared/ReviewModal'

interface LibraryModalsProps {
  // Key reveal modal
  isKeyModalOpen: boolean
  selectedProductForKey: LibraryItem | null
  onCloseKeyModal: () => void

  // Review modal
  isReviewModalOpen: boolean
  selectedProductForReview: Product | null
  onCloseReviewModal: () => void
}

export function LibraryModals({
  isKeyModalOpen,
  selectedProductForKey,
  onCloseKeyModal,
  isReviewModalOpen,
  selectedProductForReview,
  onCloseReviewModal,
}: LibraryModalsProps) {
  return (
    <>
      {/* Reveal Product Key Modal */}
      {selectedProductForKey && (
        <RevealProductModal
          isOpen={isKeyModalOpen}
          onClose={onCloseKeyModal}
          product={{
            orderId: selectedProductForKey.orderId,
            variantId: selectedProductForKey.variantId,
            imageUrl:
              selectedProductForKey.featuredImage?.url ||
              '/images/product/cover.png',
            title: selectedProductForKey.title,
            handle: selectedProductForKey.handle,
            platforms: selectedProductForKey.platform || [],
            tags: selectedProductForKey.tags || [],
            displayTags: selectedProductForKey.displayTags || [],
            categories: (selectedProductForKey.categories || []).map(
              (c) => c.title,
            ),
            productType: selectedProductForKey.productType || '',
            variantTitle: selectedProductForKey.variantTitle || '',
            selectedOptions: selectedProductForKey.selectedOptions || [],
            revealDate:
              selectedProductForKey.purchasedAt || new Date().toUTCString(),
          }}
        />
      )}

      {/* Rate Product Modal */}
      {selectedProductForReview && (
        <ReviewModal
          open={isReviewModalOpen}
          onOpenChange={onCloseReviewModal}
          product={selectedProductForReview}
        />
      )}
    </>
  )
}
