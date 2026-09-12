import { useState, useCallback } from 'react'
import type { LibraryItem } from '@/types/library'
import type { Product } from '@/types/product'

/**
 * Modal state type for key reveal modal
 */
interface KeyModalState {
  isOpen: boolean
  selectedProduct: LibraryItem | null
}

/**
 * Modal state type for review modal
 */
interface ReviewModalState {
  isOpen: boolean
  selectedProduct: Product | null
}

/**
 * Modals state container
 */
interface LibraryModalsState {
  keyModal: KeyModalState
  reviewModal: ReviewModalState
}

/**
 * Return type for useLibraryModals hook
 */
export interface UseLibraryModalsReturn {
  modals: LibraryModalsState
  openKeyModal: (product: LibraryItem) => void
  closeKeyModal: () => void
  openReviewModal: (product: LibraryItem) => void
  closeReviewModal: () => void
}

/**
 * Custom hook to manage library modal states
 * Keeps modal visibility and data synchronized
 */
export function useLibraryModals(): UseLibraryModalsReturn {
  const [modals, setModals] = useState<LibraryModalsState>({
    keyModal: {
      isOpen: false,
      selectedProduct: null,
    },
    reviewModal: {
      isOpen: false,
      selectedProduct: null,
    },
  })

  /**
   * Open key reveal modal with selected product
   */
  const openKeyModal = useCallback((product: LibraryItem) => {
    setModals((prev) => ({
      ...prev,
      keyModal: {
        isOpen: true,
        selectedProduct: product,
      },
    }))
  }, [])

  /**
   * Close key reveal modal
   */
  const closeKeyModal = useCallback(() => {
    setModals((prev) => ({
      ...prev,
      keyModal: {
        isOpen: false,
        selectedProduct: null,
      },
    }))
  }, [])

  /**
   * Open review modal with product mapped from library item
   */
  const openReviewModal = useCallback((libraryItem: LibraryItem) => {
    // Map LibraryItem to Product for ReviewModal compatibility
    const mappedProduct = {
      id: libraryItem.productId,
      handle: libraryItem.handle,
      title: libraryItem.title,
    } as Product

    setModals((prev) => ({
      ...prev,
      reviewModal: {
        isOpen: true,
        selectedProduct: mappedProduct,
      },
    }))
  }, [])

  /**
   * Close review modal
   */
  const closeReviewModal = useCallback(() => {
    setModals((prev) => ({
      ...prev,
      reviewModal: {
        isOpen: false,
        selectedProduct: null,
      },
    }))
  }, [])

  return {
    modals,
    openKeyModal,
    closeKeyModal,
    openReviewModal,
    closeReviewModal,
  }
}
