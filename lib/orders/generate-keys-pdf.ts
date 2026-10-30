import { jsPDF } from 'jspdf'
import type { OrderDetails } from '@/lib/services/order.service'
import type { KeyAssignment } from '@/lib/services/keys.service'
import { getProductsActivationInfo } from '@/lib/services/product.service'
import { formatOrderDate } from './order-formatters'
import { parseCredentialKey } from './parse-credential-key'
import { getVariantDisplayName } from '@/lib/orders/variant-title'
import { loadPdfLogo, pdfLogoSize } from '@/lib/orders/pdf-logo'
import { drawLinkRun } from '@/lib/orders/pdf-links'

type RGB = readonly [number, number, number]

// The receipt's dark theme (generate-receipt-pdf.ts), so both PDFs of an order look alike.
const BRAND: RGB = [59, 130, 246]
const PAGE_BG: RGB = [17, 24, 39]
const CARD_BG: RGB = [31, 41, 55]
const BORDER: RGB = [55, 65, 81]
const INK: RGB = [255, 255, 255]
const MUTED: RGB = [156, 163, 175]
const CHIP_BG: RGB = [36, 57, 89]
const CHIP_INK: RGB = [147, 197, 253]
// Amber for keys still on the way and the "keep private" note, tinted onto the dark page.
const AMBER_INK: RGB = [252, 211, 77]
const AMBER_BG: RGB = [48, 50, 52]
const AMBER_LINE: RGB = [149, 105, 31]
const WARN_BG: RGB = [40, 37, 36]
const WARN_LINE: RGB = [85, 64, 31]

const SITE = 'https://www.increddy.com'
const MARGIN = 20
const CARD_PAD = 5
const CONTENT_BOTTOM = 272
const LOGO_WIDTH = 44

const PENDING_TEXT = "On the way. We'll email it to you and show it in My Orders as soon as it's ready."
const REFUNDED_TEXT = 'Refunded: this key is no longer part of your order.'

type KeyRow =
  | { kind: 'key'; label: string; value: string }
  | { kind: 'note'; label: string; value: string; tone: 'pending' | 'muted' }

// One product: its title, platform and a row per key (or per login field).
type ProductBlock = { title: string; platform: string | null; guideKey: string | null; rows: KeyRow[] }

// The numbered steps of an activation guide's HTML ("1. Go to ..."), as plain text.
function guideSteps(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const lines = [...doc.body.querySelectorAll('p, li')]
    .map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  return lines.filter((line) => /^\d+[.)]\s/.test(line)).map((line) => line.replace(/^\d+[.)]\s*/, ''))
}

function buildBlocks(
  order: OrderDetails,
  keysData: KeyAssignment[],
  info: Awaited<ReturnType<typeof getProductsActivationInfo>>,
): ProductBlock[] {
  return (order.lineItems?.edges ?? []).map(({ node }) => {
    const variantId = node?.variant?.id ?? ''
    const assignments = keysData.filter((k) => k.variantId === variantId)
    const productId = assignments[0]?.productId
    const productInfo = productId ? info.get(productId) : undefined
    const variantName = getVariantDisplayName(node?.variant?.title)
    const quantity = Math.max(node?.quantity ?? 1, assignments.length)

    const rows: KeyRow[] = []
    for (let i = 0; i < quantity; i++) {
      const label = quantity > 1 ? `KEY ${i + 1} OF ${quantity}` : 'KEY'
      const assignment = assignments[i]
      const key = assignment?.key
      if (key) {
        const credential = parseCredentialKey(key)
        if (credential) {
          const suffix = quantity > 1 ? ` (${i + 1} OF ${quantity})` : ''
          rows.push({ kind: 'key', label: `LOGIN EMAIL${suffix}`, value: credential.email })
          rows.push({ kind: 'key', label: `PASSWORD${suffix}`, value: credential.password })
        } else {
          rows.push({ kind: 'key', label, value: key })
        }
      } else if (assignment?.status === 'refunded') {
        rows.push({ kind: 'note', label, value: REFUNDED_TEXT, tone: 'muted' })
      } else {
        rows.push({ kind: 'note', label, value: PENDING_TEXT, tone: 'pending' })
      }
    }

    return {
      title: `${node?.title || 'Untitled Product'}${variantName ? ` (${variantName})` : ''}`,
      platform: productInfo?.platform ?? null,
      guideKey: productInfo?.guide ? productInfo.guide.name : null,
      rows,
    }
  })
}

// Every key of an order, with the platform and the activation steps once per platform. Same dark
// look as the receipt. Keys still waiting say so (and that they'll be emailed) instead of "none".
export async function generateKeysPdf(order: OrderDetails, keysData: KeyAssignment[] = []): Promise<void> {
  const productIds = keysData.map((k) => k.productId)
  const [logo, info] = await Promise.all([
    loadPdfLogo(),
    getProductsActivationInfo(productIds).catch(() => new Map()),
  ])
  const blocks = buildBlocks(order, keysData, info)

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const right = pageWidth - MARGIN
  const width = right - MARGIN

  const setText = (size: number, color: RGB, style: 'normal' | 'bold' = 'normal', font = 'helvetica') => {
    doc.setFontSize(size)
    doc.setTextColor(...color)
    doc.setFont(font, style)
  }
  const fillPage = () => {
    doc.setFillColor(...PAGE_BG)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
  }
  const newPage = () => {
    doc.addPage()
    fillPage()
    return 20
  }

  fillPage()

  // -- Header: blue line, logo, "PRODUCT KEYS / Order #55 / date"
  doc.setFillColor(...BRAND)
  doc.rect(0, 0, pageWidth, 4, 'F')
  let y = 22
  if (logo) {
    const { width, height } = pdfLogoSize(logo, LOGO_WIDTH)
    doc.addImage(logo.dataUrl, 'PNG', MARGIN, y - height, width, height, undefined, 'FAST')
  } else {
    setText(20, INK, 'bold')
    doc.text('Increddy', MARGIN, y)
  }
  setText(9, MUTED)
  doc.text('increddy.com', MARGIN, y + 6)
  setText(8, MUTED, 'bold')
  doc.text('PRODUCT KEYS', right, y - 6, { align: 'right' })
  setText(16, INK, 'bold')
  doc.text(`Order #${order.orderNumber}`, right, y + 1, { align: 'right' })
  setText(9, MUTED)
  doc.text(order.processedAt ? formatOrderDate(order.processedAt) : '', right, y + 6, { align: 'right' })

  // -- Summary: "1 of 6 keys delivered · 5 on the way"
  y += 18
  const keyRows = blocks.flatMap((b) => b.rows).filter((r) => !r.label.startsWith('PASSWORD'))
  const total = keyRows.length
  const delivered = keyRows.filter((r) => r.kind === 'key').length
  const waiting = keyRows.filter((r) => r.kind === 'note' && r.tone === 'pending').length
  const lead = delivered === total ? `${total} ${total === 1 ? 'key' : 'keys'}` : `${delivered} of ${total} keys`
  const rest =
    delivered === total ? ', all delivered' : ` delivered${waiting ? `  ·  ${waiting} on the way` : ''}`
  setText(10, INK, 'bold')
  doc.text(lead, MARGIN, y)
  const leadWidth = doc.getTextWidth(lead)
  setText(10, MUTED)
  doc.text(rest, MARGIN + leadWidth, y)

  // -- Keep private note
  y += 5
  doc.setFillColor(...WARN_BG)
  doc.setDrawColor(...WARN_LINE)
  doc.setLineWidth(0.3)
  doc.roundedRect(MARGIN, y, width, 10, 2, 2, 'FD')
  setText(9, AMBER_INK, 'bold')
  doc.text('Keep these keys private: anyone who has a key can redeem it.', MARGIN + 4, y + 6.3)
  y += 16

  // -- One card per product. Rows are measured first so the card's background can be drawn before
  // its text; a card too long for the page continues on the next one.
  const innerWidth = width - CARD_PAD * 2
  const measureRow = (row: KeyRow) => {
    if (row.kind === 'key') {
      setText(11, INK, 'bold', 'courier')
      const lines = doc.splitTextToSize(row.value, innerWidth - 8) as string[]
      return { lines, height: 4 + lines.length * 5 + 5 + 3 }
    }
    setText(9, AMBER_INK)
    const lines = doc.splitTextToSize(row.value, innerWidth - 8) as string[]
    return { lines, height: 4 + lines.length * 4.2 + 5 + 3 }
  }

  for (const block of blocks) {
    const chip = block.platform
    setText(7.5, CHIP_INK, 'bold')
    const chipWidth = chip ? doc.getTextWidth(chip) + 6 : 0
    setText(11.5, INK, 'bold')
    const titleLines = doc.splitTextToSize(block.title, innerWidth - chipWidth - 4) as string[]
    const titleHeight = titleLines.length * 5.2 + 3
    const rows = block.rows.map((row) => ({ row, ...measureRow(row) }))

    let index = 0
    let first = true
    while (index < rows.length) {
      // Fit as many rows as the page allows (at least one), under the title.
      let height = CARD_PAD + titleHeight
      let end = index
      while (end < rows.length && y + height + rows[end].height + CARD_PAD <= CONTENT_BOTTOM) {
        height += rows[end].height
        end++
      }
      if (end === index) {
        if (y > 30) {
          y = newPage()
          continue
        }
        height += rows[end].height
        end++
      }
      height += CARD_PAD - 3

      doc.setFillColor(...CARD_BG)
      doc.roundedRect(MARGIN, y, width, height, 3, 3, 'F')
      let cy = y + CARD_PAD + 4
      setText(11.5, INK, 'bold')
      doc.text(first ? titleLines : [`${titleLines[0]}${titleLines.length > 1 ? '...' : ''} (continued)`], MARGIN + CARD_PAD, cy)
      if (chip) {
        setText(7.5, CHIP_INK, 'bold')
        doc.setFillColor(...CHIP_BG)
        doc.roundedRect(right - CARD_PAD - chipWidth, cy - 4, chipWidth, 5.5, 2.75, 2.75, 'F')
        doc.text(chip, right - CARD_PAD - chipWidth / 2, cy - 0.3, { align: 'center' })
      }
      cy += (first ? titleLines.length : 1) * 5.2 - 1

      for (const { row, lines } of rows.slice(index, end)) {
        setText(7, MUTED, 'bold')
        doc.text(row.label, MARGIN + CARD_PAD, cy + 3)
        const boxTop = cy + 4.5
        if (row.kind === 'key') {
          const boxHeight = lines.length * 5 + 5
          doc.setFillColor(...PAGE_BG)
          doc.setDrawColor(...BORDER)
          doc.setLineWidth(0.3)
          doc.roundedRect(MARGIN + CARD_PAD, boxTop, innerWidth, boxHeight, 1.8, 1.8, 'FD')
          setText(11, INK, 'bold', 'courier')
          doc.text(lines, MARGIN + CARD_PAD + 4, boxTop + 6)
          cy = boxTop + boxHeight + 3
        } else {
          const boxHeight = lines.length * 4.2 + 5
          const pending = row.tone === 'pending'
          doc.setFillColor(...(pending ? AMBER_BG : PAGE_BG))
          doc.setDrawColor(...(pending ? AMBER_LINE : BORDER))
          doc.setLineWidth(0.3)
          if (pending) doc.setLineDashPattern([1, 0.8], 0)
          doc.roundedRect(MARGIN + CARD_PAD, boxTop, innerWidth, boxHeight, 1.8, 1.8, 'FD')
          doc.setLineDashPattern([], 0)
          setText(9, pending ? AMBER_INK : MUTED)
          doc.text(lines, MARGIN + CARD_PAD + 4, boxTop + 5.6)
          cy = boxTop + boxHeight + 3
        }
      }

      y += height + 4
      index = end
      first = false
    }
  }

  // -- How to activate: each platform's steps once (from the store's Activation Guides)
  const guides = new Map<string, string[]>()
  for (const block of blocks) {
    if (!block.guideKey || guides.has(block.guideKey)) continue
    const productInfo = [...info.values()].find((i) => i.guide?.name === block.guideKey)
    const steps = productInfo?.guide ? guideSteps(productInfo.guide.html) : []
    if (steps.length) guides.set(block.guideKey, steps)
  }
  for (const [name, steps] of guides) {
    if (y + 20 > CONTENT_BOTTOM) y = newPage()
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, y, right, y)
    y += 7
    setText(8, MUTED, 'bold')
    doc.text(`HOW TO ACTIVATE ON ${name.toUpperCase()}`, MARGIN, y)
    y += 6
    steps.forEach((step, i) => {
      setText(9, INK)
      const lines = doc.splitTextToSize(step, width - 7) as string[]
      if (y + lines.length * 4.3 > CONTENT_BOTTOM) y = newPage()
      setText(9, MUTED)
      doc.text(`${i + 1}.`, MARGIN, y)
      setText(9, INK)
      doc.text(lines, MARGIN + 7, y)
      y += lines.length * 4.3 + 1.2
    })
    y += 4
  }

  // -- Footer on every page: support links and the 72-hour window, page x of n
  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page)
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, 280, right, 280)
    drawLinkRun(
      doc,
      [
        ['Key not working? Tell us within 72 hours: '],
        ['Help centre', `${SITE}/help`],
        ['  ·  '],
        ['contact support', `${SITE}/contact`],
      ],
      MARGIN,
      286,
      { color: MUTED, linkColor: BRAND },
    )
    setText(8, MUTED)
    doc.text(`Page ${page} of ${pageCount}`, right, 286, { align: 'right' })
  }

  doc.save(`Increddy-Keys-${order.orderNumber}.pdf`)
}
