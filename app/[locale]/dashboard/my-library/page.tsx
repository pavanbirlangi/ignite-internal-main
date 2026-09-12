'use client'

import { LibraryPageContainer } from '@/components/library/LibraryPageContainer'
import { useLibraryFilters } from '@/hooks/useLibraryFilters'
import { useLibraryModals } from '@/hooks/useLibraryModals'
import { libraryService } from '@/lib/services/library.service'


export default function MyLibraryPage() {

  const { queryParams, updateParam, data, loading } = useLibraryFilters(
    libraryService.getLibrary,
  )

  const {
    modals,
    openKeyModal,
    closeKeyModal,
    openReviewModal,
    closeReviewModal,
  } = useLibraryModals()

  return (
    <LibraryPageContainer
      queryParams={queryParams}
      onParamChange={updateParam}
      data={data}
      loading={loading}
      modals={modals}
      onOpenKeyModal={openKeyModal}
      onCloseKeyModal={closeKeyModal}
      onOpenReviewModal={openReviewModal}
      onCloseReviewModal={closeReviewModal}
    />
  )
}
