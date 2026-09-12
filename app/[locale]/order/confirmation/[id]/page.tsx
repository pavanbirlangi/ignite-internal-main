import OrderConfirmationPageContent from '@/components/orders/OrderConfirmationPageContent'
import { getWebPageJsonLd } from '@/lib/seo'

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale } = await params
  const webPageJsonLd = getWebPageJsonLd({
    locale,
    pathname: 'order/confirmation',
    name: 'Order Confirmation | Increddy',
    description: 'View your completed order details and confirmation.',
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageJsonLd),
        }}
      />
      <OrderConfirmationPageContent />
    </>
  )
}
