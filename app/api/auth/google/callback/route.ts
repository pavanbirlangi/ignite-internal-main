import { authService } from '@/lib/services/auth.service'

function popupResponse(
  type: 'OAUTH_SUCCESS' | 'OAUTH_ERROR',
  payload: Record<string, unknown>,
) {
  return new Response(
    `<!DOCTYPE html>
<html>
<head><title>${type === 'OAUTH_SUCCESS' ? 'Authenticating...' : 'Authentication Failed'}</title></head>
<body>
  <script>
    if (window.opener) {
      window.opener.postMessage({ type: ${JSON.stringify(type)}, payload: ${JSON.stringify(payload)} }, window.location.origin);
      window.close();
    } else {
      window.location.href = '/';
    }
  </script>
  <p>${type === 'OAUTH_SUCCESS' ? 'Authenticating...' : 'Authentication failed.'}</p>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html' } },
  )
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error) {
    return popupResponse('OAUTH_ERROR', { message: error })
  }

  if (!code || !state) {
    return popupResponse('OAUTH_ERROR', { message: 'Missing code or state' })
  }

  try {
    const result = await authService.completeGoogleAuth(code, state)
    return popupResponse('OAUTH_SUCCESS', {
      accessToken: result.token.accessToken,
      expiresAt: result.token.expiresAt,
    })
  } catch (err) {
    console.error('[Google OAuth] Failed to complete callback:', err)
    return popupResponse('OAUTH_ERROR', {
      message: 'Could not complete Google sign-in. Please try again.',
    })
  }
}
