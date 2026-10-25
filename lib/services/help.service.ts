import cmsClient from '../cms-axios'
import type { SeoData } from '../seo'
export interface ContactType {
  title: string
  text: string
  contact_email: string
}

export interface ContactUsResponse {
  data: {
    id: number
    seo?: SeoData
    heading: string
    description: string
    contact_types: ContactType[]
    bottom_text_title: string
    bottom_text_desc: string
    cta_text: string
    cta_url: string
  }
}

// A Directus guide category (collection `guide_categories`): the editor names, orders and
// publishes them; guides pick one. Guides without one are listed under "Other".
export interface GuideCategory {
  name: string
  slug: string
  sort: number | null
}

// A guide as the activation guides list shows it.
export interface GuideSummary {
  title: string
  slug: string
  image: string | null
  description: string | null
  category: GuideCategory | null
}

// The list page's own texts (Directus singleton `activation_guide`).
export interface ActivationGuidesPageContent {
  page_title: string | null
  subtitle?: string | null
  help_box_title?: string | null
  help_box_text?: string | null
  seo?: SeoData
}

export interface RelatedGuide {
  title: string
  slug: string
}

export interface GuideDetail {
  id: string
  title: string
  description: string | null
  image: string | null
  content: string
  tags: string[] | null
  author_name: string | null
  slug: string
  published_date: string | null
  date_updated?: string | null
  category?: GuideCategory | null
  related_guides: {
    related_guides_id: RelatedGuide | null
  }[]
}

const GUIDE_LIST_FIELDS = 'title,slug,image,description'
const CATEGORY_FIELDS = 'category.name,category.slug,category.sort'
const PUBLISHED = 'filter[status][_eq]=published'

// Directus refuses a query that names a field it doesn't know. Until the knowledge base fields
// exist (scripts/directus/activation-guides-kb.mjs), ask again without them.
async function getWithOptionalFields<T>(url: (optional: boolean) => string): Promise<T> {
  try {
    return (await cmsClient.get(url(true))).data
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status !== 403 && status !== 400) throw error
    return (await cmsClient.get(url(false))).data
  }
}

export interface HelpIssueType {
  id: string
  status: string
  sort: number | null
  name: string
  description: string
  icon: string
  slug: string
  redirect?: string | null
  create_ticket_global?: boolean
}

export interface HelpTopic {
  id: string
  status: string
  title: string
  description: string
  slug: string
  redirect?: string | null
  create_ticket_global?: boolean
  issue_type: {
    name: string
    create_ticket_global?: boolean
    redirect?: string | null
  }
}

export interface HelpArticle {
  id: string
  status: string
  title: string
  body: string
  cta_label: string
  cta_url: string
  redirect?: string | null
  create_ticket_global?: boolean
  help_subtopics: {
    title: string
    create_ticket_global?: boolean
    redirect?: string | null
  }
}

export interface HelpDataResponse {
  data: {
    id: number
    seo?: SeoData
    title: string
    description: string
    issue_types: {
      help_issues_types_id: HelpIssueType
    }[]
  }
}

export const HelpService = {
  getHelpItems: async (): Promise<HelpDataResponse> => {
    const response = await cmsClient.get(
      '/items/help?fields=*,issue_types.help_issues_types_id.*,seo.*',
    )
    return response.data
  },

  getHelpTopics: async (
    categorySlug: string,
  ): Promise<{ data: HelpTopic[] }> => {
    const filter = encodeURIComponent(
      JSON.stringify({
        issue_type: { slug: { _eq: categorySlug } },
      }),
    )
    const response = await cmsClient.get(
      `/items/help_subtopics?filter=${filter}&fields=*,issue_type.name,issue_type.create_ticket_global,issue_type.redirect`,
    )
    return response.data
  },

  getHelpArticles: async (
    topicSlug: string,
  ): Promise<{ data: HelpArticle[] }> => {
    const filter = encodeURIComponent(
      JSON.stringify({
        help_subtopics: { slug: { _eq: topicSlug } },
      }),
    )
    const response = await cmsClient.get(
      `/items/help_articles?filter=${filter}&fields=*,help_subtopics.title,help_subtopics.create_ticket_global,help_subtopics.redirect`,
    )
    return response.data
  },

  // The list page's texts and SEO.
  getActivationGuidesPage: async (): Promise<{ data: ActivationGuidesPageContent }> =>
    getWithOptionalFields((optional) =>
      `/items/activation_guide?fields=page_title,seo.*${optional ? ',subtitle,help_box_title,help_box_text' : ''}`,
    ),

  // Every published guide, in the editor's order (drag and drop in Directus), then by title.
  getAllActivationGuides: async (): Promise<{ data: GuideSummary[] }> =>
    getWithOptionalFields((optional) =>
      `/items/guides?${PUBLISHED}&sort=sort,title&limit=-1&fields=${GUIDE_LIST_FIELDS}${optional ? `,${CATEGORY_FIELDS}` : ''}`,
    ),

  getActivationGuideBySlug: async (
    slug: string,
  ): Promise<{ data: GuideDetail[] }> => {
    const filter = encodeURIComponent(JSON.stringify({ slug: { _eq: slug }, status: { _eq: 'published' } }))
    return getWithOptionalFields((optional) =>
      `/items/guides?filter=${filter}&fields=id,title,description,image,content,tags,author_name,slug,published_date,date_updated,related_guides.related_guides_id.title,related_guides.related_guides_id.slug${optional ? `,${CATEGORY_FIELDS}` : ''}`,
    )
  },

  getContactUsPage: async (): Promise<ContactUsResponse> => {
    const response = await cmsClient.get(
      '/items/contact_us?fields=*,contact_types.*,seo.*',
    )
    return response.data
  },
}
