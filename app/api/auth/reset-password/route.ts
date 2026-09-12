import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { id, password, resetToken } = await request.json()

    if (!id || !password || !resetToken) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 },
      )
    }

    // Ensure the ID is in Shopify GID format
    const customerId = id.startsWith('gid://')
      ? id
      : `gid://shopify/Customer/${id}`

    const mutation = `
      mutation customerReset($id: ID!, $input: CustomerResetInput!) {
        customerReset(id: $id, input: $input) {
          customer {
            email
          }
          customerAccessToken {
            accessToken
            expiresAt
          }
          customerUserErrors {
            field
            message
          }
        }
      }
    `

    const response = await fetch(
      `${process.env.SHOP_URL}/api/2024-04/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token':
            process.env.NEXT_PUBLIC_STORE_ACCESS_TOKEN || '',
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            id: customerId,
            input: {
              password,
              resetToken,
            },
          },
        }),
      },
    )

    const result = await response.json()

    if (result.errors) {
      return NextResponse.json(
        { message: result.errors[0]?.message || 'GraphQL Error' },
        { status: 500 },
      )
    }

    return NextResponse.json(result.data.customerReset)
  } catch (error: any) {
    console.error('Password reset API error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
