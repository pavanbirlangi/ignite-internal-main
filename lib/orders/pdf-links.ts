import type { jsPDF } from 'jspdf'

type RGB = readonly [number, number, number]

// A piece of text, and its URL when it's a link.
export type LinkPart = [text: string, url?: string]

// One line of text where some parts are clickable links (in `linkColor`), for the jsPDF documents
// (receipt, keys). `align: 'right'` ends the line at `x`.
export function drawLinkRun(
  doc: jsPDF,
  parts: LinkPart[],
  x: number,
  y: number,
  { color, linkColor, size = 8, align = 'left' }: { color: RGB; linkColor: RGB; size?: number; align?: 'left' | 'right' },
) {
  doc.setFontSize(size)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...color)
  const width = parts.reduce((sum, [text]) => sum + doc.getTextWidth(text), 0)
  let cursor = align === 'right' ? x - width : x
  parts.forEach(([text, url]) => {
    if (url) {
      doc.setTextColor(...linkColor)
      doc.textWithLink(text, cursor, y, { url })
      doc.setTextColor(...color)
    } else {
      doc.text(text, cursor, y)
    }
    cursor += doc.getTextWidth(text)
  })
}
