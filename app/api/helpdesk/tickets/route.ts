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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      subject,
      requesterEmail,
      requesterName,
      message,
      customFields,
      transactionID,
    } = body

    if (!subject || !requesterEmail || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, requesterEmail, message' },
        { status: 400 },
      )
    }

    const ticketPayload: Record<string, unknown> = {
      subject,
      requester: {
        email: requesterEmail,
        name: requesterName || requesterEmail,
      },
      message: {
        text: message,
      },
      author: {
        type: 'client',
      },
      status: 'open',
      isPrivate: false,
    }

    if (customFields && Object.keys(customFields).length > 0) {
      ticketPayload.customFields = customFields
    }

    if (transactionID) {
      ticketPayload.transactionID = transactionID
    }

    const hdResponse = await fetch(`${HELPDESK_BASE}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getBasicAuth(),
        'User-Agent': 'Increddy/1.0',
      },
      body: JSON.stringify(ticketPayload),
    })

    if (!hdResponse.ok) {
      const errorText = await hdResponse.text()
      console.error('[HelpDesk] Create ticket failed:', hdResponse.status, errorText)
      return NextResponse.json(
        { error: `HelpDesk error: ${hdResponse.status}` },
        { status: 502 },
      )
    }

    const ticket = await hdResponse.json()

    return NextResponse.json({
      ticketId: ticket.ID,
      shortId: ticket.shortID,
    })
  } catch (error) {
    console.error('[HelpDesk] Unexpected error creating ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
