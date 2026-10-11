/**
 * Whole-number discount percentage for a sale badge. Rounds normally, but a sale that still
 * costs something never shows as 100% (or 0%): a 99.6% discount reads "-99%", not "-100%".
 */
export function getDiscountPercent(originalPrice: number, salePrice: number): number {
  const percent = Math.round(((originalPrice - salePrice) / originalPrice) * 100)
  if (salePrice <= 0) return percent
  return Math.min(99, Math.max(1, percent))
}
