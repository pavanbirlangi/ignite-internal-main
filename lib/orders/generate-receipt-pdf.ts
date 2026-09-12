import { jsPDF } from 'jspdf'
import type { OrderDetails } from '@/lib/services/order.service'
import { formatOrderDate, formatOrderPrice } from './order-formatters'

const BRAND_BLUE = [59, 130, 246] as const // #3B82F6
const DARK_BG = [17, 24, 39] as const
const TEXT_WHITE = [255, 255, 255] as const
const TEXT_MUTED = [156, 163, 175] as const
const BORDER_COLOR = [55, 65, 81] as const

function drawLine(doc: jsPDF, y: number, width: number) {
  doc.setDrawColor(...BORDER_COLOR)
  doc.setLineWidth(0.3)
  doc.line(20, y, width - 20, y)
}

export function generateReceiptPdf(order: OrderDetails): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

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
      label: 'Payment Method',
      value:
        [order.paymentMethod?.brand, order.paymentMethod?.lastDigits]
          .filter(Boolean)
          .join(' ') ||
        order.paymentMethod?.gateway ||
        'Not available',
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
  doc.text('Qty', 130, y, { align: 'center' })
  doc.text('Price', pageWidth - 20, y, { align: 'right' })
  y += 6

  // — Line items
  const lineItems = order.lineItems?.edges ?? []
  doc.setFont('helvetica', 'normal')

  for (const item of lineItems) {
    const node = item.node
    const variant = node?.variant
    const productTitle = node?.title || 'Untitled Product'
    const variantName =
      variant?.title && variant.title !== 'Default Title'
        ? ` (${variant.title})`
        : ''

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
      100,
    )
    doc.text(titleLines, 20, y)

    doc.setTextColor(...TEXT_MUTED)
    doc.text(`${node?.quantity ?? 1}`, 130, y, { align: 'center' })

    doc.setTextColor(...TEXT_WHITE)
    doc.text(
      formatOrderPrice(variant?.price?.amount, variant?.price?.currencyCode),
      pageWidth - 20,
      y,
      { align: 'right' },
    )

    y += titleLines.length * 5 + 4
  }

  y += 4
  drawLine(doc, y, pageWidth)
  y += 10

  // — Transaction summary
  const summaryItems = [
    {
      label: 'Subtotal',
      value: formatOrderPrice(
        order.subtotalPriceV2?.amount,
        order.subtotalPriceV2?.currencyCode,
      ),
    },
    {
      label: 'Tax',
      value: formatOrderPrice(
        order.totalTaxV2?.amount,
        order.totalTaxV2?.currencyCode,
      ),
    },
    {
      label: 'Refunded',
      value: formatOrderPrice(
        order.totalRefundedV2?.amount,
        order.totalRefundedV2?.currencyCode,
      ),
    },
  ]

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
    formatOrderPrice(
      order.totalPrice?.amount,
      order.totalPrice?.currencyCode,
    ),
    pageWidth - 20,
    y,
    { align: 'right' },
  )

  y += 16

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
