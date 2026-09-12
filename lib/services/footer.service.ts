import cmsClient from '../cms-axios'

export interface FooterLink {
  name: string
  to: string
}

export interface FooterSection {
  label: string
  links: FooterLink[]
}

export interface FooterSocial {
  name: string
  logo: string
  url: string
}

export interface PaymentImage {
  directus_files_id: string
}

export interface FooterData {
  id: string
  version: 'v1' | 'v2'
  links: FooterSection[]
  location: string
  social: FooterSocial[]
  logo: string
  bottom_text: string
  payment_images: PaymentImage[]
  review_text?: string | null
  review_image?: string | null
  review_redirect_link?: string | null
}

export interface FooterResponse {
  data: FooterData
}

export const FooterService = {
  getFooterData: async (): Promise<FooterData | null> => {
    try {
      const response = await cmsClient.get<FooterResponse>(
        '/items/footer?fields=*,payment_images.directus_files_id'
      )
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch footer data:', error)
      return null
    }
  },
}
