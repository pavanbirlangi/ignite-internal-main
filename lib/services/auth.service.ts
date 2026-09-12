import medusaClient from '@/lib/medusa-axios'

export interface RegisterPayload {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface RegisterResponse {
  customer: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  token: {
    accessToken: string
    expiresAt: string
  }
}

export interface RecoverPayload {
  email: string
}

export interface RecoverResponse {
  message: string
}

export interface AccountResponse {
  id: string
  firstName: string
  lastName: string
  displayName: string
  email: string
  phone: string | null
  profile_photo: string | null
  profile_photo_id: string | null
  dob: string | null
}

export interface UpdateAccountPayload {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  phone?: string | null
  dob?: string | null
  profile_photo?: string | null
}

export interface UploadImageResponse {
  message: string
  gid: string
}

export interface DeleteImagePayload {
  gid: string
}

export interface ResetPasswordPayload {
  token: string
  password: string
}

export interface ResetPasswordResponse {
  // A fresh session token if we could log the customer straight back in after
  // the reset, or null if the update succeeded but we couldn't establish a new
  // session automatically (caller should send them to log in manually).
  token: { accessToken: string; expiresAt: string } | null
}

export interface GoogleAuthInitResponse {
  location: string
}

/**
 * Decodes a JWT payload without verifying the signature (verification always
 * happens server-side; this is purely to read non-sensitive claims like `exp`
 * or `entity_id` client-side). Works in both browser and SSR contexts.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')

    const decoded =
      typeof window !== 'undefined' && typeof window.atob === 'function'
        ? window.atob(base64)
        : Buffer.from(base64, 'base64').toString('binary')

    const jsonPayload = decodeURIComponent(
      decoded
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )

    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

function tokenExpiryIso(token: string): string {
  const payload = decodeJwtPayload(token)
  const exp = payload?.exp
  if (typeof exp === 'number') {
    return new Date(exp * 1000).toISOString()
  }
  // Fall back to a conservative 24h if the token has no readable exp claim.
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
}

function normalizeAccountResponse(customer: {
  id: string
  first_name?: string | null
  last_name?: string | null
  email: string
  phone?: string | null
  metadata?: Record<string, unknown> | null
}): AccountResponse {
  const firstName = customer.first_name || ''
  const lastName = customer.last_name || ''
  const dob = customer.metadata?.dob
  const profilePhoto = customer.metadata?.profile_photo

  return {
    id: customer.id,
    firstName,
    lastName,
    displayName: `${firstName} ${lastName}`.trim(),
    email: customer.email,
    phone: customer.phone || null,
    profile_photo: typeof profilePhoto === 'string' ? profilePhoto : null,
    profile_photo_id: null,
    dob: typeof dob === 'string' ? dob : null,
  }
}

export const authService = {
  register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
    // Medusa's customer registration is two steps: first create the auth
    // identity (get a registration-scoped token), then create the actual
    // customer record using that token as bearer auth.
    const { data: authData } = await medusaClient.post(
      '/auth/customer/emailpass/register',
      { email: payload.email, password: payload.password },
    )

    const { data: customerData } = await medusaClient.post(
      '/store/customers',
      {
        email: payload.email,
        first_name: payload.firstName,
        last_name: payload.lastName,
      },
      { headers: { Authorization: `Bearer ${authData.token}` } },
    )

    return {
      customer: {
        id: customerData.customer.id,
        email: customerData.customer.email,
        firstName: customerData.customer.first_name || '',
        lastName: customerData.customer.last_name || '',
      },
    }
  },
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await medusaClient.post('/auth/customer/emailpass', {
      email: payload.email,
      password: payload.password,
    })

    return {
      token: {
        accessToken: data.token,
        expiresAt: tokenExpiryIso(data.token),
      },
    }
  },
  recover: async (payload: RecoverPayload): Promise<RecoverResponse> => {
    // Medusa's reset-password endpoint intentionally doesn't reveal whether an
    // account exists for the given email (returns success either way), so we
    // always show the same generic message regardless of the real outcome.
    await medusaClient.post('/auth/customer/emailpass/reset-password', {
      identifier: payload.email,
    })
    return {
      message:
        'If an account exists for this email, a password reset link has been sent.',
    }
  },
  getAccount: async (): Promise<AccountResponse> => {
    const { data } = await medusaClient.get('/store/customers/me')
    return normalizeAccountResponse(data.customer)
  },
  updateAccount: async (
    payload: UpdateAccountPayload,
  ): Promise<AccountResponse> => {
    const body: Record<string, unknown> = {}

    if (payload.firstName !== undefined) body.first_name = payload.firstName
    if (payload.lastName !== undefined) body.last_name = payload.lastName
    if (payload.phone) body.phone = payload.phone

    // `dob` (and, once supported, `profile_photo`) live in Medusa's generic
    // customer.metadata JSON column -- there's no dedicated field for either.
    if (payload.dob !== undefined) {
      body.metadata = { dob: payload.dob || null }
    }

    const { data } = await medusaClient.post('/store/customers/me', body)
    return normalizeAccountResponse(data.customer)
  },
  uploadAccountImage: async (
    _file: File | Blob,
  ): Promise<UploadImageResponse> => {
    // Blocked: Medusa has no store-facing file upload route today (confirmed
    // during Phase 2 verification -- GET /store/uploads is a 404, and no
    // equivalent exists). Tracked in MEDUSA_MIGRATION_BACKEND_REQUIREMENTS.md.
    throw new Error(
      'Profile photo upload is not available yet -- it needs a new backend endpoint.',
    )
  },
  deleteAccountImage: async (_payload: DeleteImagePayload): Promise<void> => {
    throw new Error(
      'Profile photo removal is not available yet -- it needs a new backend endpoint.',
    )
  },
  resetPassword: async (
    payload: ResetPasswordPayload,
  ): Promise<ResetPasswordResponse> => {
    const { data } = await medusaClient.post(
      '/auth/customer/emailpass/update',
      { password: payload.password },
      { headers: { Authorization: `Bearer ${payload.token}` } },
    )

    // If the update response already carries a fresh session token, use it
    // directly. Otherwise, fall back to reading the identity (entity_id is
    // the customer's email, confirmed against the backend's own reset-token
    // workflow) out of the reset token and logging in fresh with the new
    // password. If neither works, the caller sends the customer to log in
    // manually -- their password is still updated either way.
    if (typeof data?.token === 'string') {
      return {
        token: {
          accessToken: data.token,
          expiresAt: tokenExpiryIso(data.token),
        },
      }
    }

    const email = decodeJwtPayload(payload.token)?.entity_id
    if (typeof email === 'string' && email) {
      try {
        const loginResult = await authService.login({
          email,
          password: payload.password,
        })
        return loginResult
      } catch {
        return { token: null }
      }
    }

    return { token: null }
  },
  /**
   * Starts the Google OAuth flow. Medusa's Google provider accepts a
   * `callback_url` override (confirmed against @medusajs/auth-google's
   * source and verified live) that redirects the browser straight back to
   * our own frontend route instead of Medusa's raw JSON callback response --
   * that URL must be registered as an Authorized Redirect URI in the Google
   * Cloud Console OAuth client, or Google will reject it.
   */
  googleAuthInit: async (
    callbackUrl: string,
  ): Promise<GoogleAuthInitResponse> => {
    const { data } = await medusaClient.get('/auth/customer/google', {
      data: { callback_url: callbackUrl },
    })
    return { location: data.location }
  },
  /**
   * Completes the Google OAuth flow given the `code`/`state` Google redirected
   * back with. Mirrors the emailpass two-step registration: a first-time
   * Google login returns an actor-less token (no linked customer yet), so we
   * create the customer record from the Google profile claims embedded in the
   * token's `user_metadata`, then call the core token-refresh endpoint (using
   * the SAME old token as bearer) to get back a fresh, customer-linked token
   * -- verified live via the equivalent emailpass path, since a real Google
   * consent flow can't be driven headlessly to test this directly.
   */
  completeGoogleAuth: async (
    code: string,
    state: string,
  ): Promise<LoginResponse> => {
    // callback_url doesn't need to be re-sent here -- Medusa already stored it
    // server-side against this `state` value when the flow was initiated.
    const { data } = await medusaClient.get(
      '/auth/customer/google/callback',
      { params: { code, state } },
    )

    const payload = decodeJwtPayload(data.token)
    const hasLinkedCustomer = Boolean(payload?.actor_id)

    let finalToken: string = data.token

    if (!hasLinkedCustomer) {
      const userMetadata = (payload?.user_metadata ?? {}) as {
        email?: string
        given_name?: string
        family_name?: string
      }

      await medusaClient.post(
        '/store/customers',
        {
          email: userMetadata.email,
          first_name: userMetadata.given_name || '',
          last_name: userMetadata.family_name || '',
        },
        { headers: { Authorization: `Bearer ${data.token}` } },
      )

      const refreshed = await medusaClient.post(
        '/auth/token/refresh',
        {},
        { headers: { Authorization: `Bearer ${data.token}` } },
      )
      finalToken = refreshed.data.token
    }

    return {
      token: {
        accessToken: finalToken,
        expiresAt: tokenExpiryIso(finalToken),
      },
    }
  },
}
