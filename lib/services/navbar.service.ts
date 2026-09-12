import cmsClient from '../cms-axios'

export interface NavItemType {
  name: string
  icon: string
  to: string
}

export interface NavbarData {
  id: string
  logo: string
  nav_items: NavItemType[]
}

export interface NavbarResponse {
  data: NavbarData
}

export const NavbarService = {
  getNavbarData: async (): Promise<NavbarData | null> => {
    try {
      const response = await cmsClient.get<NavbarResponse>('/items/navbar')
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch navbar data:', error)
      return null
    }
  },
}
