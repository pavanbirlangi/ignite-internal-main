import OrderDetailsClient from '@/components/orders/OrderDetailsClient'

type OrderDetailsPageParams = { id: string } | Promise<{ id: string }>

export default async function OrderDetailsPage({
  params,
}: {
  params: OrderDetailsPageParams
}) {
  const resolvedParams = await Promise.resolve(params)
  const decodedOrderId = decodeURIComponent(resolvedParams.id)

  return <OrderDetailsClient orderId={decodedOrderId} />
}
