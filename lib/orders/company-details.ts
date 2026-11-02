import medusaClient from '@/lib/medusa-axios'

export interface CompanyDetails {
  companyName: string
  addressLines: string[]
  taxId: string
}

// The seller's details for the receipt PDF, from Medusa Admin > Store settings > Invoices >
// Invoice details (the same ones admin invoices print). Null when the backend doesn't have the
// endpoint yet or can't be reached: the receipt then just leaves the block out.
export async function loadCompanyDetails(): Promise<CompanyDetails | null> {
  try {
    const { data } = await medusaClient.get('/store/company-details')
    const lines = Array.isArray(data?.address_lines)
      ? data.address_lines.filter((line: unknown): line is string => typeof line === 'string' && line.trim() !== '')
      : []
    const name = typeof data?.company_name === 'string' ? data.company_name.trim() : ''
    if (!name && !lines.length) return null
    return { companyName: name, addressLines: lines, taxId: typeof data?.tax_id === 'string' ? data.tax_id.trim() : '' }
  } catch {
    return null
  }
}
