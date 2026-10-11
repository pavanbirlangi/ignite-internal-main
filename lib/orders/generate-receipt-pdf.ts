import { jsPDF } from 'jspdf'
import type { OrderDetails } from '@/lib/services/order.service'
import { formatOrderDate, formatOrderPrice } from './order-formatters'
import { getVariantDisplayName } from '@/lib/orders/variant-title'

const BRAND_BLUE = [59, 130, 246] as const // #3B82F6
const DARK_BG = [17, 24, 39] as const
const TEXT_WHITE = [255, 255, 255] as const
const TEXT_MUTED = [156, 163, 175] as const
const BORDER_COLOR = [55, 65, 81] as const

const toNumber = (amount?: string | number) => {
  const value = typeof amount === 'string' ? Number.parseFloat(amount) : (amount ?? 0)
  return Number.isFinite(value) ? value : 0
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

function drawLine(doc: jsPDF, y: number, width: number) {
  doc.setDrawColor(...BORDER_COLOR)
  doc.setLineWidth(0.3)
  doc.line(20, y, width - 20, y)
}

// Every amount is in the currency the payment was charged in (USD) -- the receipt records the
// charge itself, not the display currency the customer browsed in.
export function generateReceiptPdf(order: OrderDetails): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const currency = order.totalPrice?.currencyCode ?? 'usd'
  const money = (amount: number) => formatOrderPrice(amount, currency)

  // — Dark background
  doc.setFillColor(...DARK_BG)
  doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F')

  let y = 20

  // — Header
  doc.setFontSize(22)
  doc.setTextColor(...TEXT_WHITE)
  doc.setFont('helvetica', 'bold')
  doc.text('Increddy', 20, y)

  doc.setFontSize(12)
  doc.setTextColor(...BRAND_BLUE)
  doc.setFont('helvetica', 'bold')
  doc.text('ORDER RECEIPT', pageWidth - 20, y, { align: 'right' })

  y += 12
  drawLine(doc, y, pageWidth)
  y += 10

  // — Order metadata
  const metaItems = [
    {
      label: 'Order Number',
      value: `#${order.orderNumber}`,
    },
    {
      label: 'Date',
      value: order.processedAt ? formatOrderDate(order.processedAt) : '-',
    },
    {
      label: 'Billed To',
      value: order.email || '-',
    },
    {
      label: 'Payment Method',
      value: order.paymentMethod?.brand
        ? `${capitalize(order.paymentMethod.brand)}${
            order.paymentMethod.lastDigits ? ` ending in ${order.paymentMethod.lastDigits}` : ''
          }`
        : order.paymentMethod?.gateway || 'Not available',
    },
  ]

  for (const item of metaItems) {
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_MUTED)
    doc.setFont('helvetica', 'normal')
    doc.text(item.label, 20, y)
    doc.setFontSize(10)
    doc.setTextColor(...TEXT_WHITE)
    doc.setFont('helvetica', 'bold')
    doc.text(item.value, pageWidth - 20, y, { align: 'right' })
    y += 8
  }

  y += 4
  drawLine(doc, y, pageWidth)
  y += 10

  // — Line items header
  doc.setFontSize(9)
  doc.setTextColor(...TEXT_MUTED)
  doc.setFont('helvetica', 'bold')
  doc.text('Product', 20, y)
  doc.text('Qty', 115, y, { align: 'center' })
  doc.text('Unit Price', 150, y, { align: 'right' })
  doc.text('Amount', pageWidth - 20, y, { align: 'right' })
  y += 6

  // — Line items
  const lineItems = order.lineItems?.edges ?? []
  doc.setFont('helvetica', 'normal')
  let productSubtotal = 0

  for (const item of lineItems) {
    const node = item.node
    const variant = node?.variant
    const productTitle = node?.title || 'Untitled Product'
    const variantDisplayName = getVariantDisplayName(variant?.title)
    const variantName = variantDisplayName ? ` (${variantDisplayName})` : ''

    // Check for page overflow
    if (y > 260) {
      doc.addPage()
      doc.setFillColor(...DARK_BG)
      doc.rect(
        0,
        0,
        pageWidth,
        doc.internal.pageSize.getHeight(),
        'F',
      )
      y = 20
    }

    doc.setFontSize(10)
    doc.setTextColor(...TEXT_WHITE)
    const titleLines = doc.splitTextToSize(
      `${productTitle}${variantName}`,
      80,
    )
    doc.text(titleLines, 20, y)

    const quantity = node?.quantity ?? 1
    const unitPrice = toNumber(variant?.price?.amount)
    productSubtotal += unitPrice * quantity

    doc.setTextColor(...TEXT_MUTED)
    doc.text(`${quantity}`, 115, y, { align: 'center' })
    doc.text(money(unitPrice), 150, y, { align: 'right' })

    doc.setTextColor(...TEXT_WHITE)
    doc.text(money(unitPrice * quantity), pageWidth - 20, y, { align: 'right' })

    y += titleLines.length * 5 + 4
  }

  y += 4
  drawLine(doc, y, pageWidth)
  y += 10

  // — Transaction summary. Medusa's own subtotal includes the service-fee line (it's a real order
  // line item), so the products are summed above and the fee gets its own row. Discount, tax and
  // refunds only show when they apply.
  const discount = toNumber(order.totalDiscountV2?.amount)
  const fee = order.platformFee ?? 0
  const tax = toNumber(order.totalTaxV2?.amount)
  const refunded = toNumber(order.totalRefundedV2?.amount)
  const summaryItems = [{ label: 'Subtotal', value: money(productSubtotal) }]
  if (discount > 0) summaryItems.push({ label: 'Discount', value: `-${money(discount)}` })
  if (fee > 0) summaryItems.push({ label: order.platformFeeLabel || 'Service Fee', value: money(fee) })
  if (tax > 0) summaryItems.push({ label: 'Tax', value: money(tax) })
  if (refunded > 0) summaryItems.push({ label: 'Refunded', value: `-${money(refunded)}` })

  for (const item of summaryItems) {
    doc.setFontSize(10)
    doc.setTextColor(...TEXT_MUTED)
    doc.setFont('helvetica', 'normal')
    doc.text(item.label, 20, y)
    doc.setTextColor(...TEXT_WHITE)
    doc.text(item.value, pageWidth - 20, y, { align: 'right' })
    y += 8
  }

  y += 2
  drawLine(doc, y, pageWidth)
  y += 8

  // — Total
  doc.setFontSize(13)
  doc.setTextColor(...TEXT_WHITE)
  doc.setFont('helvetica', 'bold')
  doc.text('Total', 20, y)
  doc.text(
    `${money(toNumber(order.totalPrice?.amount))} ${currency.toUpperCase()}`,
    pageWidth - 20,
    y,
    { align: 'right' },
  )

  y += 16

  doc.setFontSize(8)
  doc.setTextColor(...TEXT_MUTED)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `All amounts are in ${currency.toUpperCase()}, the currency your payment was charged in.`,
    pageWidth / 2,
    y,
    { align: 'center' },
  )
  y += 8

  // — Footer
  doc.setFontSize(8)
  doc.setTextColor(...TEXT_MUTED)
  doc.setFont('helvetica', 'normal')
  doc.text(
    'This is a computer-generated receipt and does not require a signature.',
    pageWidth / 2,
    y,
    { align: 'center' },
  )
  doc.text(
    'Thank you for shopping with Increddy!',
    pageWidth / 2,
    y + 5,
    { align: 'center' },
  )

  doc.save(`Increddy-Receipt-${order.orderNumber}.pdf`)
}
