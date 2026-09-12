import { formatPrice } from '@/lib/currency'

export function formatOrderDate(isoDate: string): string {
  const date = new Date(isoDate)

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatOrderPrice(
  amount?: string | number,
  currencyCode?: string,
): string {
  if (amount === undefined || !currencyCode) {
    return '-'
  }

  return formatPrice(amount, currencyCode)
}
