// Images for the About page artwork (the 3D fan, the "How it works" card and the words filled with
// covers). The editor picks them in Directus (About Us > Animation images, in order); when there are
// fewer than ABOUT_COVER_COUNT, product covers fill the rest, bright recognisable ones first, so the
// page never shows a gap.

export interface AboutCover {
  title: string
  handle: string
  image: string
}

const PREFERRED_HANDLES = [
  'cyberpunk-2077-pc-gog-key',
  'minecraft-java-bedrock-edition',
  'assassins-creed-pc-ubisoft-connect-key',
  'lego-city-undercover-pc-steam-key',
  'totally-accurate-battle-simulator-pc-steam-key',
  'project-winter-pc-steam-key',
  'risk-of-rain-2-pc-steam-key',
  'dishonored-2-pc-steam-key',
  'batman-arkham-knight-pc-steam-key',
  'ghostrunner-pc-steam-key',
  'far-cry-4-pc-ubisoft-connect-key',
  'lego-jurassic-world-pc-steam-key',
]

export const ABOUT_COVER_COUNT = 12

const CMS_BASE = process.env.NEXT_PUBLIC_CMS_API_URL?.replace(/\/+$/, '') ?? ''

// Short cache so a change in Directus shows within minutes.
const CMS_REVALIDATE_SECONDS = 300

async function getCmsAboutImages(): Promise<AboutCover[]> {
  if (!CMS_BASE) return []
  try {
    const response = await fetch(
      `${CMS_BASE}/items/about_us?fields=animation_images.sort,animation_images.directus_files_id.id,animation_images.directus_files_id.title`,
      { next: { revalidate: CMS_REVALIDATE_SECONDS } },
    )
    if (!response.ok) return []
    const { data } = (await response.json()) as {
      data?: {
        animation_images?: { sort: number | null; directus_files_id: { id: string; title: string | null } | null }[]
      }
    }
    return (data?.animation_images ?? [])
      .filter((row) => row.directus_files_id)
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
      .map((row, index) => {
        const file = row.directus_files_id!
        return {
          title: file.title ?? '',
          // Only used as a React key; the same image may be picked twice.
          handle: `cms-${index}-${file.id}`,
          image: `${CMS_BASE}/assets/${file.id}`,
        }
      })
  } catch (error) {
    console.error('[About] Failed to load images from Directus:', error)
    return []
  }
}

export async function getAboutCovers(): Promise<AboutCover[]> {
  const cmsImages = (await getCmsAboutImages()).slice(0, ABOUT_COVER_COUNT)
  if (cmsImages.length >= ABOUT_COVER_COUNT) return cmsImages
  const productCovers = await getProductCovers()
  return [...cmsImages, ...productCovers].slice(0, ABOUT_COVER_COUNT)
}

async function getProductCovers(): Promise<AboutCover[]> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/products?limit=60&fields=title,handle,thumbnail`,
      {
        headers: { 'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? '' },
        next: { revalidate: 3600 },
      },
    )
    if (!response.ok) return []
    const { products = [] } = (await response.json()) as {
      products?: { title: string; handle: string; thumbnail: string | null }[]
    }
    const withImage = products.filter((p) => p.thumbnail)
    const byHandle = new Map(withImage.map((p) => [p.handle, p]))
    const preferred = PREFERRED_HANDLES.map((h) => byHandle.get(h)).filter((p) => p !== undefined)
    const rest = withImage.filter((p) => !PREFERRED_HANDLES.includes(p.handle))
    return [...preferred, ...rest].slice(0, ABOUT_COVER_COUNT).map((p) => ({
      title: p.title,
      handle: p.handle,
      image: p.thumbnail as string,
    }))
  } catch (error) {
    console.error('[About] Failed to load product covers:', error)
    return []
  }
}
