import cmsClient from '../cms-axios'
import type { SeoData } from '../seo'
export interface AboutSection1Block {
  title: string
  subtitle: string
  description: string
}

export interface AboutSection2Block {
  title: string
  icon: string
  description: string
}

export interface AboutUsData {
  id: string
  seo?: SeoData
  title: string
  description: string
  btn_text: string
  btn_url: string
  show_img: boolean
  section1_title: string
  section1_blocks: AboutSection1Block[]
  section2_title: string
  section2_description: string
  section2_blocks: AboutSection2Block[]
}

export interface AboutUsResponse {
  data: AboutUsData
}

export const AboutService = {
  getAboutUsPage: async (): Promise<AboutUsResponse> => {
    const response = await cmsClient.get('/items/about_us?fields=*,section1_blocks.*,section2_blocks.*,seo.*')
    return response.data
  },
}
