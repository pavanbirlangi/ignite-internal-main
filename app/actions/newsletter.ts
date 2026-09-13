'use server'

import { newsletterService } from '@/lib/services/newsletter.service'
import { extractApiErrorMessage } from '@/lib/utils/api-error'

type SubscribeResult = {
  success: boolean
  message: string
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
    await newsletterService.subscribe(normalizedEmail)

    return {
      success: true,
      message: 'Subscribed successfully',
    }
  } catch (error) {
    return {
      success: false,
      message: extractApiErrorMessage(error, 'Subscription failed'),
    }
  }
}
