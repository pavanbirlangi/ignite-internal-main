import medusaClient from '../medusa-axios'

export const newsletterService = {
  subscribe: async (email: string): Promise<void> => {
    await medusaClient.post('/store/newsletter-subscribe', { email })
  },
}
