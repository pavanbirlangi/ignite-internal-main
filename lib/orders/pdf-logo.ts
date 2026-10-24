// The Increddy logo for the jsPDF documents (receipt, keys): white wordmark with the blue dot,
// 700x92 px (aspect 7.6:1), drawn on their dark pages.
const LOGO_URL = '/images/common/logo-receipt.png'
const LOGO_ASPECT = 700 / 92

export const pdfLogoHeight = (width: number) => width / LOGO_ASPECT

// The logo as a data URL for jsPDF, or null if it can't be loaded (the PDF then prints the name
// as text instead).
export async function loadPdfLogo(): Promise<string | null> {
  try {
    const response = await fetch(LOGO_URL)
    if (!response.ok) return null
    const blob = await response.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}
