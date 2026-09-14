import { isValidPhoneNumber } from 'libphonenumber-js'

export const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
export const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/

export const extractApiErrorMessage = (
  error: any,
  fallback: string,
): string => {
  const validationErrors = error?.response?.data?.errors
  if (Array.isArray(validationErrors) && validationErrors.length > 0) {
    return validationErrors
      .map((item: { message?: string }) => item.message)
      .filter(Boolean)
      .join(', ')
  }
  return error?.response?.data?.message || fallback
}

export const normalizePhoneInput = (value: string): string => {
  const trimmedValue = value.replace(/\s+/g, '')
  const sanitizedValue = trimmedValue
    .replace(/(?!^)\+/g, '')
    .replace(/[^\d+]/g, '')
  const hasLeadingPlus = sanitizedValue.startsWith('+')
  const digitsOnly = sanitizedValue.replace(/\D/g, '').slice(0, 15)
  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly
}

export const normalizeDobInput = (value: string): string => {
  const digitsOnly = value.replace(/\D/g, '').slice(0, 8)
  const year = digitsOnly.slice(0, 4)
  const month = digitsOnly.slice(4, 6)
  const day = digitsOnly.slice(6, 8)
  return [year, month, day].filter(Boolean).join('-')
}

export const validatePhoneValue = (value: string): string => {
  const normalized = normalizePhoneInput(value.replace(/\s+/g, ''))
  if (!normalized) throw new Error('Phone number is required')
  if (!isValidPhoneNumber(normalized))
    throw new Error('Please enter a valid phone number')
  return normalized
}

export const validateDobValue = (value: string): string => {
  const normalized = value.trim()
  if (!normalized) return ''

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized))
    throw new Error('Date of birth must be in YYYY-MM-DD format')

  const [year, month, day] = normalized.split('-').map(Number)
  const dobDate = new Date(Date.UTC(year, month - 1, day))

  const isValidDate =
    dobDate.getUTCFullYear() === year &&
    dobDate.getUTCMonth() === month - 1 &&
    dobDate.getUTCDate() === day

  if (!isValidDate) throw new Error('Date of birth is invalid')

  const today = new Date()
  const todayUtc = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
  )
  if (dobDate > todayUtc)
    throw new Error('Date of birth cannot be in the future')

  return normalized
}

export const splitDisplayName = (
  name: string,
): { firstName: string; lastName: string } => {
  const normalized = name.trim().replace(/\s+/g, ' ')
  if (!normalized) return { firstName: '', lastName: '' }
  const parts = normalized.split(' ')
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}
