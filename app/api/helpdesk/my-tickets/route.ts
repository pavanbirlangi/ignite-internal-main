import { NextRequest, NextResponse } from 'next/server'

const HELPDESK_BASE = 'https://api.helpdesk.com/v1'

function getBasicAuth(): string {
  const accountId = process.env.HELPDESK_ACCOUNT_ID
  const apiToken = process.env.HELPDESK_API_TOKEN
  if (!accountId || !apiToken) {
    throw new Error('HelpDesk credentials are not configured')
  }
  return `Basic ${Buffer.from(`${accountId}:${apiToken}`).toString('base64')}`
}

/**
 * GET /api/helpdesk/my-tickets
 *
 * Returns the list of tickets from HelpDesk filtered by the requester email
 * passed as a query param: ?email=user@example.com
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'email query param is required' },
        { status: 400 },
      )
    }

    // HelpDesk supports filtering tickets by requester email via the requester query param
    const url = new URL(`${HELPDESK_BASE}/tickets`)
    url.searchParams.set('pageSize', '50')
    url.searchParams.set('sortBy', 'createdAt')
    url.searchParams.set('order', 'desc')
    url.searchParams.set('eventsScope', 'none') // skip events in list for performance

    const hdResponse = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: getBasicAuth(),
        'User-Agent': 'Increddy/1.0',
        'Content-Type': 'application/json',
      },
      // cache: 'no-store' is the default in App Router server components / route handlers
    })

    if (!hdResponse.ok) {
      const errText = await hdResponse.text()
      console.error(
        '[HelpDesk] List tickets failed:',
        hdResponse.status,
        errText,
      )
      return NextResponse.json(
        { error: `HelpDesk error: ${hdResponse.status}` },
        { status: 502 },
      )
    }

    const data = await hdResponse.json()
    // data is an array of tickets
    const tickets = Array.isArray(data)
      ? data
      : (data.tickets ?? data.data ?? [])

    // Filter client-side by requester email (HelpDesk list API doesn't support filtering by requester email via query param directly)
    const filtered = tickets.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t: any) => t?.requester?.email?.toLowerCase() === email.toLowerCase(),
    )

    return NextResponse.json({ tickets: filtered })
  } catch (error) {
    console.error('[HelpDesk] Unexpected error listing tickets:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
