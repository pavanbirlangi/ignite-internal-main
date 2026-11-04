import type { Metadata } from 'next'
import { generateSeoMetadata } from '@/lib/seo'

// The page itself is a client component, so its title and canonical come from here.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return generateSeoMetadata(
    null,
    locale,
    'help/create-ticket',
    'Create a Ticket | Increddy',
    'Contact Increddy support about an order, a key or a payment.',
  )
}

export default function CreateTicketLayout({ children }: { children: React.ReactNode }) {
  return children
}
