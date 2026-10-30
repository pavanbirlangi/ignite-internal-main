// The Increddy logo for the jsPDF documents (receipt, keys), drawn on their dark pages: the same
// Directus file as the header and footer (navbar.logo), so a new logo uploaded there shows up in
// the PDFs too. The bundled copy (white wordmark with the blue dot) is used if Directus can't be
// reached.
const FALLBACK_LOGO_URL = '/images/common/logo-receipt.png'
const FALLBACK_ASPECT = 700 / 92

export interface PdfLogo {
  dataUrl: string
  /** Width / height of the image, so a differently shaped logo isn't stretched. */
  aspect: number
}

// The logo's size in the PDF: as wide as `maxWidth`, unless that would make it taller than the
// wordmark is at that width (a squarer logo is then narrowed to the same height).
export function pdfLogoSize(logo: PdfLogo, maxWidth: number): { width: number; height: number } {
  const maxHeight = maxWidth / FALLBACK_ASPECT
  const width = Math.min(maxWidth, maxHeight * logo.aspect)
  return { width, height: width / logo.aspect }
}

async function directusLogoUrl(): Promise<string | null> {
  const cmsBase = process.env.NEXT_PUBLIC_CMS_API_URL?.replace(/\/+$/, '')
  if (!cmsBase) return null
  const response = await fetch(`${cmsBase}/items/navbar?fields=logo`)
  if (!response.ok) return null
  const json = (await response.json()) as { data?: { logo?: string | null } }
  return json.data?.logo ? `${cmsBase}/assets/${json.data.logo}` : null
}

async function loadImage(url: string): Promise<PdfLogo | null> {
  const response = await fetch(url)
  if (!response.ok) return null
  const blob = await response.blob()
  // jsPDF draws these as PNG; anything else (e.g. an SVG upload) uses the bundled copy.
  if (blob.type !== 'image/png') return null
  const bitmap = await createImageBitmap(blob)
  const aspect = bitmap.width / bitmap.height
  bitmap.close()
  const dataUrl = await new Promise<string | null>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(blob)
  })
  return dataUrl ? { dataUrl, aspect: aspect || FALLBACK_ASPECT } : null
}

// The logo for jsPDF, or null if neither copy can be loaded (the PDF then prints the name as text
// instead).
export async function loadPdfLogo(): Promise<PdfLogo | null> {
  try {
    const url = await directusLogoUrl()
    const logo = url ? await loadImage(url) : null
    if (logo) return logo
  } catch {
    // Falls through to the bundled copy.
  }
  try {
    return await loadImage(FALLBACK_LOGO_URL)
  } catch {
    return null
  }
}
