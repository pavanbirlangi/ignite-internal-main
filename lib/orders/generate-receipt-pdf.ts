import { jsPDF } from 'jspdf'
import type { OrderDetails } from '@/lib/services/order.service'
import { formatOrderDate, formatOrderPrice } from './order-formatters'
import { getVariantDisplayName } from '@/lib/orders/variant-title'

type RGB = readonly [number, number, number]

// A white page with the site's blue as the only accent -- prints cleanly and reads like a
// receipt from any modern store, unlike a full-page dark background.
const BRAND: RGB = [36, 104, 223] // #2468DF, the site's primary
const INK: RGB = [17, 24, 39]
const MUTED: RGB = [107, 114, 128]
const BORDER: RGB = [229, 231, 235]
const SOFT_BG: RGB = [243, 244, 246]

const STATUS_STYLES: Record<string, { label: string; color: RGB }> = {
  PAID: { label: 'PAID', color: [22, 163, 74] },
  REFUNDED: { label: 'REFUNDED', color: [217, 119, 6] },
  VOIDED: { label: 'VOIDED', color: MUTED },
  PENDING: { label: 'PAYMENT PENDING', color: MUTED },
}

const MARGIN = 20
const PAGE_BOTTOM = 270

const toNumber = (amount?: string | number) => {
  const value = typeof amount === 'string' ? Number.parseFloat(amount) : (amount ?? 0)
  return Number.isFinite(value) ? value : 0
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

function paymentMethodLabel(order: OrderDetails): string {
  const { brand, lastDigits, gateway } = order.paymentMethod ?? {}
  if (brand && lastDigits) return `${capitalize(brand)} ending in ${lastDigits}`
  if (brand) return capitalize(brand)
  return gateway ? capitalize(gateway) : 'Not available'
}

// The receipt records the charge itself, so every amount is in the currency the payment was
// charged in (USD) -- never the display currency the customer browsed in, whose rate moves daily
// and wouldn't match their card statement.
export function generateReceiptPdf(order: OrderDetails): void {
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

  // — Header
  doc.setFillColor(...BRAND)
  doc.rect(0, 0, pageWidth, 4, 'F')

  let y = 22
  setText(20, INK, 'bold')
  doc.text('Increddy', MARGIN, y)
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
  const columnX = [MARGIN, pageWidth / 2 + 5]
  details.forEach(([label, value], index) => {
    const x = columnX[index % 2]
    const rowY = y + Math.floor(index / 2) * 13
    setText(7.5, MUTED, 'bold')
    doc.text(label, x, rowY)
    setText(10, INK)
    doc.text(value, x, rowY + 5)
  })
  y += 2 * 13 + 4

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

  let productSubtotal = 0
  for (const { node } of order.lineItems?.edges ?? []) {
    const variantName = getVariantDisplayName(node?.variant?.title)
    const title = `${node?.title || 'Untitled Product'}${variantName ? ` (${variantName})` : ''}`
    const quantity = node?.quantity ?? 1
    const unitPrice = toNumber(node?.variant?.price?.amount)
    const amount = unitPrice * quantity
    productSubtotal += amount

    setText(10, INK)
    const titleLines: string[] = doc.splitTextToSize(title, qtyX - MARGIN - 14)
    const rowHeight = titleLines.length * 5 + 4
    if (y + rowHeight > PAGE_BOTTOM) {
      doc.addPage()
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

  // — Totals. Medusa's own subtotal includes the service-fee line (it's a real order line item),
  // so the products are summed here and the fee gets its own row.
  const discount = toNumber(order.totalDiscountV2?.amount)
  const fee = order.platformFee ?? 0
  const tax = toNumber(order.totalTaxV2?.amount)
  const total = toNumber(order.totalPrice?.amount)
  const refunded = toNumber(order.totalRefundedV2?.amount)

  const rows: Array<[string, string]> = [['Subtotal', money(productSubtotal)]]
  if (discount > 0) rows.push(['Discount', `-${money(discount)}`])
  if (fee > 0) rows.push([order.platformFeeLabel || 'Service Fee', money(fee)])
  if (tax > 0) rows.push(['Tax', money(tax)])

  if (y + rows.length * 7 + 40 > PAGE_BOTTOM) {
    doc.addPage()
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

  // — Currency note
  y += 6
  setText(8.5, MUTED)
  const note = doc.splitTextToSize(
    `All amounts are in ${currency.toUpperCase()}, the currency your payment was charged in. ` +
      'Prices shown in another currency while shopping are converted estimates; your bank ' +
      'statement shows this amount, converted by your bank if your card uses a different currency.',
    right - MARGIN,
  )
  doc.text(note, MARGIN, y)

  // — Footer, on every page
  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page)
    rule(279)
    setText(8, MUTED)
    doc.text('Questions about this order? Visit increddy.com/help', MARGIN, 285)
    doc.text('This receipt was generated electronically and is valid without a signature.', MARGIN, 289)
    if (pageCount > 1) doc.text(`Page ${page} of ${pageCount}`, right, 285, { align: 'right' })
  }

  doc.save(`Increddy-Receipt-${order.orderNumber}.pdf`)
}
