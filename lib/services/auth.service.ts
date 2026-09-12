import apiClient from '@/lib/axios'
import axios from 'axios'

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
  id: string
  password: string
  resetToken: string
}

export interface ResetPasswordResponse {
  customer: {
    email: string
  } | null
  customerAccessToken: {
    accessToken: string
    expiresAt: string
  } | null
  customerUserErrors: Array<{
    field: string[]
    message: string
  }>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function normalizeAccountResponse(payload: unknown): AccountResponse {
  if (!isRecord(payload)) {
    throw new Error('Invalid account response')
  }

  const nestedData = isRecord(payload.data) ? payload.data : null
  const candidate =
    nestedData?.customer ??
    nestedData?.user ??
    payload.customer ??
    payload.user ??
    payload

  if (candidate === null || !isRecord(candidate)) {
    throw new Error('Customer data not found in response')
  }

  const id = asString(candidate.id)
  const email = asString(candidate.email)

  if (!id || !email) {
    throw new Error('Invalid customer object structure: missing id or email')
  }

  const firstName = asString(candidate.firstName)
  const lastName = asString(candidate.lastName)
  const displayNameFromApi = asString(candidate.displayName)

  return {
    id,
    firstName,
    lastName,
    displayName: displayNameFromApi || `${firstName} ${lastName}`.trim(),
    email,
    phone: asNullableString(candidate.phone),
    profile_photo: asNullableString(candidate.profile_photo),
    profile_photo_id: asNullableString(candidate.profile_photo_id),
    dob: asNullableString(candidate.dob),
  }
}

const toSafeString = (value: string | null | undefined) => value ?? ''

const sanitizeUpdateAccountPayload = (
  payload: UpdateAccountPayload,
): Partial<Record<keyof UpdateAccountPayload, string>> => {
  const sanitizedPayload: Partial<Record<keyof UpdateAccountPayload, string>> =
    {}

  for (const [key, value] of Object.entries(payload) as Array<
    [keyof UpdateAccountPayload, string | null | undefined]
  >) {
    if (value !== undefined) {
      sanitizedPayload[key] = toSafeString(value)
    }
  }

  return sanitizedPayload
}

export const authService = {
  register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>(
      '/auth/register',
      payload,
    )
    return response.data
  },
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', payload)
    return response.data
  },
  recover: async (payload: RecoverPayload): Promise<RecoverResponse> => {
    const response = await apiClient.post<RecoverResponse>(
      '/auth/recover',
      payload,
    )
    return response.data
  },
  getAccount: async (): Promise<AccountResponse> => {
    const response = await apiClient.get('/account/me')
    return normalizeAccountResponse(response.data)
  },
  updateAccount: async (
    payload: UpdateAccountPayload,
  ): Promise<AccountResponse> => {
    const safePayload = sanitizeUpdateAccountPayload(payload)
    const response = await apiClient.put<AccountResponse>(
      '/account/me',
      safePayload,
    )
    return normalizeAccountResponse(response.data)
  },
  uploadAccountImage: async (
    file: File | Blob,
  ): Promise<UploadImageResponse> => {
    const formData = new FormData()
    if (file instanceof File) {
      formData.append('image', file, file.name)
    } else {
      formData.append('image', file, 'profile-image')
    }
    const response = await apiClient.post<UploadImageResponse>(
      '/account/upload-image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )
    return response.data
  },
  deleteAccountImage: async (payload: DeleteImagePayload): Promise<void> => {
    await apiClient.delete('/account/delete-image', { data: payload })
  },
  customerReset: async (
    payload: ResetPasswordPayload,
  ): Promise<ResetPasswordResponse> => {
    const response = await axios.post<ResetPasswordResponse>(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/reset-password`,
      payload,
    )
    return response.data
  },
}
