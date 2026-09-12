/**
 * Re-export the shared formatCurrency as formatApiCurrency so that existing
 * cart imports continue to work without changes.
 */
export { formatCurrency as formatApiCurrency } from '@/lib/currency'
