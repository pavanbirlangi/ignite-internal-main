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
 * POST /api/helpdesk/attachments
 *
 * Accepts multipart/form-data with one or more "file" fields.
 * Optionally accepts a "ticketID" field when uploading attachments for an existing ticket reply.
 *
 * Flow:
 *   1. Create a HelpDesk transaction — include ticketID if replying to an existing ticket
 *   2. Upload ALL files in a single multipart request using "attachments" as the field key
 *   3. Return { transactionID } to the caller
 *
 * The transactionID is then passed to PATCH /api/helpdesk/ticket/[id] (reply)
 * or POST /api/helpdesk/tickets (new ticket) so HelpDesk attaches the uploaded files.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = getBasicAuth()

    // Parse the form data first so we can extract the optional ticketID
    const incomingForm = await request.formData()
    const ticketID = incomingForm.get('ticketID') as string | null

    // Step 1: Create a transaction.
    // When replying to an existing ticket, ticketID MUST be included or HelpDesk
    // will reject the transactionID later with a 409 "designated to different ticket" error.
    const txBody: Record<string, string> = {}
    if (ticketID) txBody.ticketID = ticketID

    const txResponse = await fetch(`${HELPDESK_BASE}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
        'User-Agent': 'IgniteKeys/1.0',
      },
      body: JSON.stringify(txBody),
    })

    if (!txResponse.ok) {
      const errText = await txResponse.text()
      console.error('[HelpDesk] Create transaction failed:', txResponse.status, errText)
      return NextResponse.json(
        { error: `HelpDesk transaction error: ${txResponse.status}` },
        { status: 502 },
      )
    }

    const tx = await txResponse.json()
    const transactionID: string = tx.ID

    if (!transactionID) {
      console.error('[HelpDesk] Transaction created but ID missing:', tx)
      return NextResponse.json(
        { error: 'HelpDesk returned an invalid transaction' },
        { status: 502 },
      )
    }

    // Step 2: Upload ALL files in a single multipart request.
    // HelpDesk requires the field key to be "attachments" (not "file").
    const files = incomingForm.getAll('file') as File[]

    if (files.length === 0) {
      return NextResponse.json({ transactionID })
    }

    const uploadForm = new FormData()
    for (const file of files) {
      // Key MUST be "attachments" per HelpDesk API docs
      uploadForm.append('attachments', file, file.name)
    }

    const uploadResponse = await fetch(
      `${HELPDESK_BASE}/transactions/${transactionID}/attachments`,
      {
        method: 'POST',
        headers: {
          Authorization: auth,
          'User-Agent': 'Increddy/1.0',
          // Do NOT set Content-Type — fetch sets it automatically with the correct boundary
        },
        body: uploadForm,
      },
    )

    if (!uploadResponse.ok) {
      const errText = await uploadResponse.text()
      console.error('[HelpDesk] Upload attachments failed:', uploadResponse.status, errText)
      // Non-fatal: return the transactionID anyway; the ticket will be created without attachments.
    } else {
      const uploaded = await uploadResponse.json()
      console.log('[HelpDesk] Attachments uploaded:', uploaded)
    }

    return NextResponse.json({ transactionID })
  } catch (error) {
    console.error('[HelpDesk] Unexpected error uploading attachments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
