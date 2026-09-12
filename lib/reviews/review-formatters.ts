export const REVIEW_STROKE_LENGTH = 175.9

export function formatReviewDate(value?: string) {
  if (!value) {
    return 'Recently posted'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Recently posted'
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatReviewCount(count: number) {
  return new Intl.NumberFormat('en-IN').format(count)
}

export function getRatingPercentage(averageRating: number) {
  return Math.min(100, Math.max(0, (averageRating / 5) * 100))
}
