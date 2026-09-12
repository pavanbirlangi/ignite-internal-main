'use server'

type SubscribeResult = {
  success: boolean
  message: string
}

function getApiBaseUrl() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL

  if (!apiBaseUrl) {
    throw new Error('API URL is not configured')
  }

  return apiBaseUrl.replace(/\/+$/, '')
}

export async function subscribeToNewsletter(
  email: string,
): Promise<SubscribeResult> {
  const normalizedEmail = email.trim()

  if (!normalizedEmail) {
    return {
      success: false,
      message: 'Email is required',
    }
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: normalizedEmail,
      }),
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      return {
        success: false,
        message: payload?.message || payload?.error || 'Subscription failed',
      }
    }

    return {
      success: true,
      message: payload?.message || 'Subscribed successfully',
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Subscription failed',
    }
  }
}
