// Product covers for the About page artwork (the 3D fan, the "How it works" card and the words
// filled with covers). Bright, recognisable covers first; anything missing from the catalogue is
// skipped and the list is topped up with other products, so the page never shows a gap.

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

export async function getAboutCovers(): Promise<AboutCover[]> {
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
