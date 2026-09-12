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
 * GET /api/helpdesk/ticket/[id]
 *
 * Fetches a single HelpDesk ticket by its UUID (HelpDesk internal ID).
 * Returns the ticket including all events (the full conversation thread).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const hdResponse = await fetch(`${HELPDESK_BASE}/tickets/${id}`, {
      method: 'GET',
      headers: {
        Authorization: getBasicAuth(),
        'User-Agent': 'Increddy/1.0',
        'Content-Type': 'application/json',
      },
    })

    if (hdResponse.status === 404) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (!hdResponse.ok) {
      const errText = await hdResponse.text()
      console.error('[HelpDesk] Get ticket failed:', hdResponse.status, errText)
      return NextResponse.json(
        { error: `HelpDesk error: ${hdResponse.status}` },
        { status: 502 },
      )
    }

    const ticket = await hdResponse.json()

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('[HelpDesk] Unexpected error fetching ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

/**
 * POST /api/helpdesk/ticket/[id]
 *
 * Adds a message (thread reply) to an existing ticket.
 *
 * Per the official HelpDesk API docs (ticketUpdate operation):
 * Replies are added via PATCH /tickets/{id} with { author, message: { text }, isPrivate }
 * See: https://api.helpdesk.com/docs#tag/Tickets/operation/ticketUpdate
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { message, transactionID } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // HelpDesk API: adding a message is done by PATCHing the ticket itself.
    // NOTE: isPrivate is NOT allowed when author.type is 'client'.
    const payload: Record<string, unknown> = {
      author: { type: 'client' },
      message: { text: message },
    }

    if (transactionID) {
      payload.transactionID = transactionID
    }

    const hdResponse = await fetch(`${HELPDESK_BASE}/tickets/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: getBasicAuth(),
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'IgniteKeys/1.0',
      },
      body: JSON.stringify(payload),
    })

    const responseText = await hdResponse.text()
    console.log(`[HelpDesk] PATCH /tickets/${id} → ${hdResponse.status}: ${responseText.slice(0, 300)}`)

    if (!hdResponse.ok) {
      console.error(`[HelpDesk] Add message failed: ${hdResponse.status}`, responseText)
      return NextResponse.json(
        { error: `HelpDesk error: ${hdResponse.status}`, details: responseText },
        { status: 502 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[HelpDesk] Unexpected error adding message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

