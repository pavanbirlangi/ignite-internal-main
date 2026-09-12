import type {
  GetLibraryParams,
  LibraryResponse,
  LibraryItem,
} from '@/types/library'
import { LibraryHeader } from '@/components/library/LibraryHeader'
import { LibraryTabs } from '@/components/library/LibraryTabs'
import { LibraryProductList } from '@/components/library/LibraryProductList'
import { LibraryModals } from '@/components/library/LibraryModals'
import type { Product } from '@/types/product'

interface LibraryPageContainerProps {
  // Filter state and handlers
  queryParams: GetLibraryParams
  onParamChange: (key: keyof GetLibraryParams, value: any) => void

  // Data and loading state
  data: LibraryResponse | null
  loading: boolean

  // Modal state and handlers
  modals: {
    keyModal: { isOpen: boolean; selectedProduct: LibraryItem | null }
    reviewModal: { isOpen: boolean; selectedProduct: Product | null }
  }
  onOpenKeyModal: (product: LibraryItem) => void
  onCloseKeyModal: () => void
  onOpenReviewModal: (product: LibraryItem) => void
  onCloseReviewModal: () => void
}

/**
 * Main layout container for library page
 * Orchestrates all sections: header, filters, product list, and modals
 */
export function LibraryPageContainer({
  queryParams,
  onParamChange,
  data,
  loading,
  modals,
  onOpenKeyModal,
  onCloseKeyModal,
  onOpenReviewModal,
  onCloseReviewModal,
}: LibraryPageContainerProps) {
  return (
    <>
      {/* Page Header */}
      <LibraryHeader
        search={queryParams.search || ''}
        onSearchChange={(val) => onParamChange('search', val)}
        sort={queryParams.sort || 'purchased_at'}
        order={queryParams.order || 'desc'}
        onSortChange={(sort, order) => {
          onParamChange('sort', sort)
          onParamChange('order', order)
        }}
      />

      {/* Filter Tabs Section */}
      <div className="border-secondary mt-8 border-y py-4">
        <LibraryTabs
          categories={data?.facets.categories}
          activeCategory={queryParams.category || ''}
          onCategoryChange={(val) => onParamChange('category', val)}
          platforms={data?.facets.platforms}
          activePlatform={queryParams.platform || ''}
          onPlatformChange={(val) => onParamChange('platform', val)}
          productTypes={data?.facets.productTypes}
          activeProductType={queryParams.productType || ''}
          onProductTypeChange={(val) => onParamChange('productType', val)}
        />
      </div>

      {/* Product List and Pagination */}
      <LibraryProductList
        data={data}
        loading={loading}
        currentPage={queryParams.page || 1}
        onPageChange={(page) => onParamChange('page', page)}
        onViewKey={onOpenKeyModal}
        onRateProduct={onOpenReviewModal}
      />

      {/* Modals */}
      <LibraryModals
        isKeyModalOpen={modals.keyModal.isOpen}
        selectedProductForKey={modals.keyModal.selectedProduct}
        onCloseKeyModal={onCloseKeyModal}
        isReviewModalOpen={modals.reviewModal.isOpen}
        selectedProductForReview={modals.reviewModal.selectedProduct}
        onCloseReviewModal={onCloseReviewModal}
      />
    </>
  )
}
