import { unstable_cache } from 'next/cache'
import cmsClient from '../cms-axios'
import type {
  CmsProductResponse,
  CmsSystemRequirement,
  CmsGalleryItem,
  CmsDropdownOptionGroup,
} from '@/types/cms-product'
import type { ProductGalleryItem } from '@/types/product'

const CMS_ASSETS_BASE =
  process.env.NEXT_PUBLIC_CMS_API_URL?.replace(/\/+$/, '') ?? ''

/** Mapped system requirement for a single platform, ready for the UI component */
export interface CmsMappedSystemRequirement {
  platform: string
  minimum: {
    os: string
    processor: string
    memory: string
    graphics: string
    storage: string
  } | null
  recommended: {
    os: string
    processor: string
    memory: string
    graphics: string
    storage: string
  } | null
}

/** Map a CMS system requirement entry to a UI-ready structure */
function mapSystemRequirement(
  item: CmsSystemRequirement,
): CmsMappedSystemRequirement {
  const minimum =
    item.requirements.find((r) => r.type === 'minimum') ?? null
  const recommended =
    item.requirements.find((r) => r.type === 'recommended') ?? null

  return {
    platform: item.platform,
    minimum: minimum
      ? {
          os: minimum.os,
          processor: minimum.processor,
          memory: minimum.memory,
          graphics: minimum.graphics,
          storage: minimum.storage,
        }
      : null,
    recommended: recommended
      ? {
          os: recommended.os,
          processor: recommended.processor,
          memory: recommended.memory,
          graphics: recommended.graphics,
          storage: recommended.storage,
        }
      : null,
  }
}

/** Map a CMS gallery item to the existing ProductGalleryItem type */
function mapGalleryItem(item: CmsGalleryItem): ProductGalleryItem | null {
  if (item.status !== 'published') return null

  if (item.type === 'youtube_url' && item.youtube_url) {
    return {
      type: 'EXTERNAL_VIDEO',
      url: item.youtube_url,
      host: 'YOUTUBE',
      altText: null,
    }
  }

  if (item.type === 'image' && item.file) {
    return {
      type: 'IMAGE',
      url: `${CMS_ASSETS_BASE}/assets/${item.file}`,
      altText: null,
    }
  }

  return null
}

export interface CmsMappedDropdownOption {
  id: string
  label: string
  slug: string
  isActive: boolean
}

export interface CmsMappedDropdownGroup {
  id: string
  groupName: string
  options: CmsMappedDropdownOption[]
}

function mapDropdownGroup(
  item: CmsDropdownOptionGroup,
  currentSlug: string,
): CmsMappedDropdownGroup | null {
  if (item.status !== 'published') return null

  const groupName =
    typeof item.group_name === 'string'
      ? item.group_name
      : item.group_name?.name ?? ''

  const options = (item.group_options ?? [])
    .map((groupOption) => groupOption.group_options_id)
    .filter(
      (option) =>
        option.status === 'published' &&
        typeof option.label === 'string' &&
        option.label.trim() &&
        typeof option.slug === 'string' &&
        option.slug.trim(),
    )
    .map((option) => ({
      id: option.id,
      label: option.label.trim(),
      slug: option.slug.trim(),
      isActive:
        option.is_Active === true || option.slug.trim() === currentSlug,
    }))

  if (options.length === 0) return null

  return {
    id: item.id,
    groupName: groupName.trim(),
    options,
  }
}

export interface CmsProductResult {
  gallery: ProductGalleryItem[]
  systemRequirements: CmsMappedSystemRequirement[]
  dropdownOptions: CmsMappedDropdownGroup[]
}

const _fetchProductCmsData = async (
  slug: string,
): Promise<CmsProductResult | null> => {
  try {
    const response = await cmsClient.get<CmsProductResponse>(
      '/items/products',
      {
        params: {
          'filter': JSON.stringify({ slug: { _eq: slug } }),
          'fields':
            'system_requirements.system_requirements_id.*,gallery.product_gallery_id.*,dropdown_options.dropdown_options_id.*,dropdown_options.dropdown_options_id.group_name.*,dropdown_options.dropdown_options_id.group_options.group_options_id.*',
        },
      },
    )

    const product = response.data.data?.[0]
    if (!product) return null

    const gallery = (product.gallery ?? [])
      .map((g) => mapGalleryItem(g.product_gallery_id))
      .filter((item): item is ProductGalleryItem => item !== null)

    const systemRequirements = (product.system_requirements ?? [])
      .filter((s) => s.system_requirements_id.status === 'published')
      .map((s) => mapSystemRequirement(s.system_requirements_id))

    const dropdownOptions = (product.dropdown_options ?? [])
      .map((item) => mapDropdownGroup(item.dropdown_options_id, slug))
      .filter((item): item is CmsMappedDropdownGroup => item !== null)

    return { gallery, systemRequirements, dropdownOptions }
  } catch (error) {
    console.error(
      `[CmsProductService] Failed to fetch CMS data for slug: ${slug}`,
      error,
    )
    return null
  }
}

export const CmsProductService = {
  /**
   * Fetch gallery and system requirements from Directus CMS by product slug.
   * Returns null if product not found or on error.
   * Cached for 60 seconds via Next.js Data Cache.
   */
  getProductCmsData: unstable_cache(
    _fetchProductCmsData,
    ['cms-product-data'],
    { revalidate: 60, tags: ['cms-product'] },
  ),
}
