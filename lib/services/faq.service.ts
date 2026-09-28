import cmsClient from '../cms-axios'

export interface FaqCategory {
  id: string
  name: string
  slug: string
}

export interface FaqItem {
  id: string
  question: string
  answer: string
  category: FaqCategory | null
}

interface RawFaqItem {
  id: string
  question: string
  answer: string
  category: { id: string; name: string; slug: string } | null
}

const FAQ_FIELDS = 'id,question,answer,category.id,category.name,category.slug'

function mapFaq(raw: RawFaqItem): FaqItem {
  return {
    id: raw.id,
    question: raw.question,
    answer: raw.answer,
    category: raw.category
      ? { id: raw.category.id, name: raw.category.name, slug: raw.category.slug }
      : null,
  }
}

async function fetchFaqs(
  filter: Record<string, unknown>,
  sort = 'sort',
): Promise<FaqItem[]> {
  const { data } = await cmsClient.get<{ data: RawFaqItem[] }>('/items/faqs', {
    params: {
      filter: JSON.stringify(filter),
      fields: FAQ_FIELDS,
      sort,
    },
  })
  return (data.data ?? []).map(mapFaq)
}

export const FaqService = {
  /** FAQs for a page-level category (e.g. "homepage", "cart") that aren't product-specific. */
  getByCategory: async (categorySlug: string): Promise<FaqItem[]> => {
    return fetchFaqs({
      status: { _eq: 'published' },
      category: { slug: { _eq: categorySlug } },
      product: { _null: true },
    })
  },

  /**
   * FAQs for a specific product (matched by Medusa handle, stored as the Directus
   * `products.slug`). Falls back to the generic "product-page" category when the
   * product has no FAQs of its own.
   */
  getForProduct: async (productHandle: string): Promise<FaqItem[]> => {
    const productSpecific = await fetchFaqs({
      status: { _eq: 'published' },
      product: { slug: { _eq: productHandle } },
    })
    if (productSpecific.length > 0) return productSpecific
    return FaqService.getByCategory('product-page')
  },

  /** Every published, non-product-specific FAQ, grouped by category, for a dedicated FAQ page. */
  getAllGrouped: async (): Promise<{ category: FaqCategory; items: FaqItem[] }[]> => {
    const items = await fetchFaqs(
      {
        status: { _eq: 'published' },
        product: { _null: true },
      },
      'category.sort,sort',
    )

    const groups = new Map<string, { category: FaqCategory; items: FaqItem[] }>()
    for (const item of items) {
      if (!item.category) continue
      const existing = groups.get(item.category.id)
      if (existing) {
        existing.items.push(item)
      } else {
        groups.set(item.category.id, { category: item.category, items: [item] })
      }
    }
    return Array.from(groups.values())
  },
}
