import { jsPDF } from 'jspdf'
import type { OrderDetails } from '@/lib/services/order.service'
import { formatOrderDate, formatOrderPrice } from './order-formatters'
import { getVariantDisplayName } from '@/lib/orders/variant-title'
import { getForeignCharge, getPaymentMethodName } from '@/lib/orders/payment-method'
import { loadPdfLogo, pdfLogoSize } from '@/lib/orders/pdf-logo'
import { drawLinkRun, type LinkPart } from '@/lib/orders/pdf-links'

type RGB = readonly [number, number, number]

// The receipt's dark theme: dark page, white text, muted labels, blue accent.
const BRAND: RGB = [59, 130, 246] // #3B82F6
const PAGE_BG: RGB = [17, 24, 39]
const INK: RGB = [255, 255, 255]
const MUTED: RGB = [156, 163, 175]
const BORDER: RGB = [55, 65, 81]
const SOFT_BG: RGB = [31, 41, 55]

const STATUS_STYLES: Record<string, { label: string; color: RGB }> = {
  PAID: { label: 'PAID', color: [22, 163, 74] },
  REFUNDED: { label: 'REFUNDED', color: [217, 119, 6] },
  PARTIALLY_REFUNDED: { label: 'PARTIALLY REFUNDED', color: [217, 119, 6] },
  VOIDED: { label: 'VOIDED', color: MUTED },
  PENDING: { label: 'PAYMENT PENDING', color: MUTED },
}

const MARGIN = 20

const SITE = 'https://www.increddy.com'
// Same accounts as the email footer (Discord and X have no URL yet).
const SOCIAL_LINKS: Array<[string, string]> = [
  ['Facebook', 'https://facebook.com/increddycom'],
  ['Instagram', 'https://www.instagram.com/increddycom/'],
  ['LinkedIn', 'https://www.linkedin.com/company/increddy'],
]
const LOGO_WIDTH = 44
const PAGE_BOTTOM = 270

const toNumber = (amount?: string | number) => {
  const value = typeof amount === 'string' ? Number.parseFloat(amount) : (amount ?? 0)
  return Number.isFinite(value) ? value : 0
}

// An amount with its currency code, no symbol ("11.63 EUR", "17,325 KRW"): jsPDF's built-in font
// can't draw every currency symbol (₩, zł).
const amountWithCode = (amount: number, currencyCode: string) => {
  const code = currencyCode.toUpperCase()
  let digits = 2
  try {
    digits =
      new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).resolvedOptions()
        .maximumFractionDigits ?? 2
  } catch {
    digits = 2
  }
  const number = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount)
  return `${number} ${code}`
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

function paymentMethodLabel(order: OrderDetails): string {
  const { brand, lastDigits } = order.paymentMethod ?? {}
  if (brand && lastDigits) return `${capitalize(brand)} ending in ${lastDigits}`
  if (brand) return capitalize(brand)
  return getPaymentMethodName(order.paymentMethod)
}

// The receipt records the charge itself, so every amount is in the currency the payment was
// charged in (USD) -- never the display currency the customer browsed in, whose rate moves daily
// and wouldn't match their card statement.
export async function generateReceiptPdf(order: OrderDetails): Promise<void> {
  const logo = await loadPdfLogo()
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const right = pageWidth - MARGIN
  const currency = order.totalPrice?.currencyCode ?? 'usd'
  const money = (amount: number) => formatOrderPrice(amount, currency)

  const setText = (size: number, color: RGB, style: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(size)
    doc.setTextColor(...color)
    doc.setFont('helvetica', style)
  }
  const rule = (y: number, from = MARGIN, to = right) => {
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.3)
    doc.line(from, y, to, y)
  }
  // One line of 8 pt text where some parts are clickable links (in the brand blue).
  const linkRun = (parts: LinkPart[], x: number, y: number, align: 'left' | 'right' = 'left') =>
    drawLinkRun(doc, parts, x, y, { color: MUTED, linkColor: BRAND, align })

  const fillPage = () => {
    doc.setFillColor(...PAGE_BG)
    doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F')
  }
  const addPage = () => {
    doc.addPage()
    fillPage()
  }
  fillPage()

  // — Header
  doc.setFillColor(...BRAND)
  doc.rect(0, 0, pageWidth, 4, 'F')

  let y = 22
  if (logo) {
    // Bottom edge on the text baseline the name used to sit on.
    const { width, height } = pdfLogoSize(logo, LOGO_WIDTH)
    doc.addImage(logo.dataUrl, 'PNG', MARGIN, y - height, width, height, undefined, 'FAST')
  } else {
    setText(20, INK, 'bold')
    doc.text('Increddy', MARGIN, y)
  }
  setText(9, MUTED)
  doc.text('increddy.com', MARGIN, y + 6)

  setText(9, MUTED, 'bold')
  doc.text('RECEIPT', right, y - 6, { align: 'right' })
  setText(16, INK, 'bold')
  doc.text(`#${order.orderNumber}`, right, y + 1, { align: 'right' })

  const status = STATUS_STYLES[order.financialStatus] ?? STATUS_STYLES.PENDING
  setText(8, [255, 255, 255], 'bold')
  const pillWidth = doc.getTextWidth(status.label) + 6
  doc.setFillColor(...status.color)
  doc.roundedRect(right - pillWidth, y + 4, pillWidth, 5.5, 1.5, 1.5, 'F')
  doc.text(status.label, right - pillWidth / 2, y + 7.8, { align: 'center' })

  y += 18
  rule(y)
  y += 9

  // — Details, two columns
  const details: Array<[string, string]> = [
    ['BILLED TO', order.email || '-'],
    ['DATE', order.processedAt ? formatOrderDate(order.processedAt) : '-'],
    ['PAYMENT METHOD', paymentMethodLabel(order)],
    ['CURRENCY', currency.toUpperCase()],
  ]
  // Stripe's reference, what support looks the payment up by.
  if (order.paymentMethod?.reference) details.push(['PAYMENT REFERENCE', order.paymentMethod.reference])
  const columnX = [MARGIN, pageWidth / 2 + 5]
  details.forEach(([label, value], index) => {
    const x = columnX[index % 2]
    const rowY = y + Math.floor(index / 2) * 13
    setText(7.5, MUTED, 'bold')
    doc.text(label, x, rowY)
    setText(10, INK)
    doc.text(value, x, rowY + 5)
  })
  y += Math.ceil(details.length / 2) * 13 + 4

  // — Items table
  const qtyX = 122
  const unitX = 155
  const drawTableHeader = () => {
    doc.setFillColor(...SOFT_BG)
    doc.rect(MARGIN, y - 5, right - MARGIN, 8, 'F')
    setText(7.5, MUTED, 'bold')
    doc.text('ITEM', MARGIN + 3, y)
    doc.text('QTY', qtyX, y, { align: 'center' })
    doc.text('UNIT PRICE', unitX, y, { align: 'right' })
    doc.text('AMOUNT', right - 3, y, { align: 'right' })
    y += 9
  }
  drawTableHeader()

  for (const { node } of order.lineItems?.edges ?? []) {
    const variantName = getVariantDisplayName(node?.variant?.title)
    const title = `${node?.title || 'Untitled Product'}${variantName ? ` (${variantName})` : ''}`
    const quantity = node?.quantity ?? 1
    const unitPrice = toNumber(node?.variant?.price?.amount)
    const amount = unitPrice * quantity

    setText(10, INK)
    const titleLines: string[] = doc.splitTextToSize(title, qtyX - MARGIN - 14)
    const rowHeight = titleLines.length * 5 + 4
    if (y + rowHeight > PAGE_BOTTOM) {
      addPage()
      y = 24
      drawTableHeader()
      setText(10, INK)
    }
    doc.text(titleLines, MARGIN + 3, y)
    setText(10, MUTED)
    doc.text(String(quantity), qtyX, y, { align: 'center' })
    doc.text(money(unitPrice), unitX, y, { align: 'right' })
    setText(10, INK)
    doc.text(money(amount), right - 3, y, { align: 'right' })
    y += rowHeight
    rule(y - 3)
    y += 3
  }

  // — Totals. The subtotal is products only; the service fee gets its own row.
  const discount = toNumber(order.totalDiscountV2?.amount)
  const fee = order.platformFee ?? 0
  const tax = toNumber(order.totalTaxV2?.amount)
  const total = toNumber(order.totalPrice?.amount)
  const refunded = toNumber(order.totalRefundedV2?.amount)

  const rows: Array<[string, string]> = [['Subtotal', money(order.itemsSubtotal)]]
  if (discount > 0) rows.push(['Discount', `-${money(discount)}`])
  if (fee > 0) rows.push([order.platformFeeLabel || 'Service Fee', money(fee)])
  if (tax > 0) rows.push(['Tax', money(tax)])

  if (y + rows.length * 7 + 40 > PAGE_BOTTOM) {
    addPage()
    y = 24
  }
  y += 4
  const labelX = 118
  for (const [label, value] of rows) {
    setText(10, MUTED)
    doc.text(label, labelX, y)
    setText(10, INK)
    doc.text(value, right - 3, y, { align: 'right' })
    y += 7
  }

  rule(y - 3, labelX, right)
  y += 4
  setText(12, INK, 'bold')
  doc.text('Total paid', labelX, y)
  setText(12, BRAND, 'bold')
  doc.text(`${money(total)} ${currency.toUpperCase()}`, right - 3, y, { align: 'right' })
  y += 8

  // A local method charged in its own currency (e.g. Bancontact in EUR): the amount on the
  // customer's bank statement.
  const foreignCharge = getForeignCharge(order.paymentMethod, currency)
  if (foreignCharge) {
    const chargedCode = foreignCharge.currency.toUpperCase()
    setText(10, MUTED)
    doc.text(`Charged in ${chargedCode}`, labelX, y)
    setText(10, INK)
    doc.text(amountWithCode(foreignCharge.amount, chargedCode), right - 3, y, { align: 'right' })
    y += 7
  }

  if (refunded > 0) {
    setText(10, MUTED)
    doc.text('Refunded', labelX, y)
    doc.text(`-${money(refunded)}`, right - 3, y, { align: 'right' })
    y += 7
    setText(10, INK, 'bold')
    doc.text('Net paid', labelX, y)
    doc.text(money(Math.max(total - refunded, 0)), right - 3, y, { align: 'right' })
    y += 7
  }

  // — Note
  y += 6
  setText(8.5, MUTED, 'bold')
  doc.text('NOTE', MARGIN, y)
  y += 4.5
  setText(8.5, MUTED)
  const note = doc.splitTextToSize(
    foreignCharge
      ? `Amounts are in ${currency.toUpperCase()}, the store's currency. You paid with ` +
          `${getPaymentMethodName(order.paymentMethod)} in ${foreignCharge.currency.toUpperCase()}: ` +
          `${amountWithCode(foreignCharge.amount, foreignCharge.currency)} was charged, ` +
          'converted at the rate fixed when you paid. Your bank statement shows that amount.'
      : `All amounts are in ${currency.toUpperCase()}, the currency your payment was charged in. ` +
          'Prices shown in another currency while shopping are converted estimates; your bank ' +
          'statement shows this amount, converted by your bank if your card uses a different currency.',
    right - MARGIN,
  )
  doc.text(note, MARGIN, y)
  y += note.length * 3.6 + 6

  // Refunds, in the words of the refund policy (72 hours, faulty or not as described)
  const refundText = doc.splitTextToSize(
    "Problem with a key? Refund requests are accepted within 72 hours of purchase for a key that " +
      "doesn't work or isn't as described.",
    right - MARGIN,
  )
  if (y + 9 + refundText.length * 3.6 > PAGE_BOTTOM) {
    addPage()
    y = 20
  }
  setText(8.5, MUTED, 'bold')
  doc.text('REFUNDS', MARGIN, y)
  y += 4.5
  setText(8.5, MUTED)
  doc.text(refundText, MARGIN, y)
  y += refundText.length * 3.6
  linkRun([['Read the refund policy', `${SITE}/legal/refund-policy`]], MARGIN, y)

  // — Footer, on every page
  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page)
    rule(275)
    setText(9, INK, 'bold')
    doc.text('Thank you for shopping with Increddy!', MARGIN, 281)
    const social: LinkPart[] = [['Follow us: ']]
    SOCIAL_LINKS.forEach(([name, url], index) => {
      if (index > 0) social.push(['  ·  '])
      social.push([name, url])
    })
    linkRun(social, right, 281, 'right')
    linkRun(
      [
        ['Questions about this order? Visit the '],
        ['Help centre', `${SITE}/help`],
        [' or '],
        ['contact support', `${SITE}/contact`],
        ['.'],
      ],
      MARGIN,
      286,
    )
    setText(8, MUTED)
    doc.text('This receipt was generated electronically and is valid without a signature.', MARGIN, 290)
    if (pageCount > 1) doc.text(`Page ${page} of ${pageCount}`, right, 286, { align: 'right' })
  }

  doc.save(`Increddy-Receipt-${order.orderNumber}.pdf`)
}
