/** CMS (Directus) types for product gallery and system requirements */

export interface CmsRequirementEntry {
  type: 'minimum' | 'recommended'
  os: string
  processor: string
  memory: string
  graphics: string
  storage: string
}

export interface CmsSystemRequirement {
  id: string
  status: string
  sort: number | null
  platform: string
  type: string | null
  requirements: CmsRequirementEntry[]
}

export interface CmsGalleryItem {
  id: string
  status: string
  sort: number | null
  type: 'youtube_url' | 'image'
  file: string | null
  youtube_url: string | null
}

export interface CmsDropdownGroupName {
  name: string
}

export interface CmsDropdownOptionItem {
  id: string
  status: string
  sort: number | null
  label: string
  slug: string
  is_Active: boolean | null
}

export interface CmsDropdownOptionGroup {
  id: string
  status: string
  sort: number | null
  group_name: CmsDropdownGroupName | string | null
  group_options: Array<{
    group_options_id: CmsDropdownOptionItem
  }>
}

export interface CmsProductData {
  system_requirements: Array<{
    system_requirements_id: CmsSystemRequirement
  }>
  gallery: Array<{
    product_gallery_id: CmsGalleryItem
  }>
  dropdown_options?: Array<{
    dropdown_options_id: CmsDropdownOptionGroup
  }>
}

export interface CmsProductResponse {
  data: CmsProductData[]
}
