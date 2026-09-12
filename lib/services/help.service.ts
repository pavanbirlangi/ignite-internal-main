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

export interface ActivationGuide {
  title: string
  image: string
  slug: string
  published_date: string
}

export interface ActivationGuidesResponse {
  data: {
    page_title: string
    seo?: SeoData
    guides: {
      guides_id: ActivationGuide
    }[]
  }
}

export interface RelatedGuide {
  title: string
  image: string
  slug: string
  published_date: string
}

export interface GuideDetail {
  id: string
  title: string
  description: string
  image: string
  content: string
  tags: string[]
  author_name: string
  author_profile: string
  slug: string
  published_date: string
  date_updated?: string
  related_guides: {
    related_guides_id: RelatedGuide
  }[]
}

export interface SearchGuideResult {
  title: string
  slug: string
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

  getActivationGuides: async (): Promise<ActivationGuidesResponse> => {
    const response = await cmsClient.get(
      '/items/activation_guide?fields=page_title,guides.guides_id.title,guides.guides_id.image,guides.guides_id.slug,guides.guides_id.published_date,seo.*',
    )
    return response.data
  },

  getActivationGuideBySlug: async (
    slug: string,
  ): Promise<{ data: GuideDetail[] }> => {
    const filter = encodeURIComponent(JSON.stringify({ slug: { _eq: slug } }))
    const response = await cmsClient.get(
      `/items/guides?filter=${filter}&fields=*,related_guides.related_guides_id.title,related_guides.related_guides_id.image,related_guides.related_guides_id.slug,related_guides.related_guides_id.published_date`,
    )
    return response.data
  },

  getContactUsPage: async (): Promise<ContactUsResponse> => {
    const response = await cmsClient.get(
      '/items/contact_us?fields=*,contact_types.*,seo.*',
    )
    return response.data
  },

  searchActivationGuides: async (
    query: string,
  ): Promise<{ data: SearchGuideResult[] }> => {
    if (!query) return { data: [] }
    const filter = encodeURIComponent(
      JSON.stringify({ title: { _icontains: query } }),
    )
    const response = await cmsClient.get(
      `/items/guides?filter=${filter}&fields=title,slug`,
    )
    return response.data
  },
}
