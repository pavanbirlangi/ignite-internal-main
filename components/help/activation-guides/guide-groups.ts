import type { GuideSummary } from '@/lib/services/help.service'

// Guides without a category (or before the Directus category field exists) go in this group.
export const OTHER_GROUP = 'other'

export interface GuideGroup {
  slug: string
  name: string
  guides: GuideSummary[]
}

/** The guides grouped by category, in the editor's category order; "Other" last. */
export function groupGuides(guides: GuideSummary[], otherName: string): GuideGroup[] {
  const groups = new Map<string, GuideGroup & { sort: number }>()
  for (const guide of guides) {
    const category = guide.category?.slug ? guide.category : null
    const slug = category?.slug ?? OTHER_GROUP
    if (!groups.has(slug)) {
      groups.set(slug, {
        slug,
        name: category?.name || otherName,
        sort: slug === OTHER_GROUP ? Infinity : (category?.sort ?? Number.MAX_SAFE_INTEGER),
        guides: [],
      })
    }
    groups.get(slug)!.guides.push(guide)
  }
  return [...groups.values()]
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name))
    .map(({ slug, name, guides }) => ({ slug, name, guides }))
}

const CMS_BASE_URL = (process.env.NEXT_PUBLIC_CMS_API_URL || '').replace(/\/+$/, '')

/** A Directus file id as a URL; null when the guide has no image. */
export function guideImageUrl(fileId: string | null | undefined): string | null {
  return fileId ? `${CMS_BASE_URL}/assets/${fileId}` : null
}
