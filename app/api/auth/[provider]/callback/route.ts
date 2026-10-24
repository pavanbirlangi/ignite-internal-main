import { authService, isSocialProvider, SOCIAL_PROVIDER_LABELS } from '@/lib/services/auth.service'
import {
  OAUTH_CHANNEL,
  OAUTH_RESULT_KEY,
  OAUTH_RETURN_KEY,
} from '@/lib/auth/oauth-return'

// With an opener (desktop popup) the result is posted back and the popup closes. Without one
// (phones: the popup was blocked and the whole tab went to Google, or the popup tab lost its
// opener on the way) the result is broadcast to the other tab and also left in this tab's
// session storage before going back to the page the sign-in started from, where
// GoogleSignInReturn finishes it (for every provider). Previously this path dropped the token and went home.
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
    var result = { type: ${JSON.stringify(type)}, payload: ${JSON.stringify(payload)} };
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(result, window.location.origin);
      window.close();
    } else {
      try { new BroadcastChannel(${JSON.stringify(OAUTH_CHANNEL)}).postMessage(result); } catch (e) {}
      var back = '/';
      try {
        back = sessionStorage.getItem(${JSON.stringify(OAUTH_RETURN_KEY)}) || '/';
        sessionStorage.removeItem(${JSON.stringify(OAUTH_RETURN_KEY)});
        sessionStorage.setItem(${JSON.stringify(OAUTH_RESULT_KEY)}, JSON.stringify(result));
      } catch (e) {}
      if (back.charAt(0) !== '/' || back.charAt(1) === '/') back = '/';
      // A popup tab opened by the site can close itself; a tab that went to Google whole can't,
      // so it goes back to where the sign-in started.
      window.close();
      setTimeout(function () { window.location.replace(back); }, 300);
    }
  </script>
  <p>${type === 'OAUTH_SUCCESS' ? 'Authenticating...' : 'Authentication failed.'}</p>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html' } },
  )
}

// R-03: one callback for Google, Discord and Facebook (/api/auth/<provider>/callback); each URL is
// registered as a redirect URI with its provider.
export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  if (!isSocialProvider(provider)) {
    return popupResponse('OAUTH_ERROR', { message: 'Unknown sign-in provider' })
  }
  const label = SOCIAL_PROVIDER_LABELS[provider]
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
    const result = await authService.completeSocialAuth(provider, code, state)
    return popupResponse('OAUTH_SUCCESS', {
      accessToken: result.token.accessToken,
      expiresAt: result.token.expiresAt,
    })
  } catch (err) {
    console.error(`[${label} OAuth] Failed to complete callback:`, err)
    // The backend explains a refusal it can name (e.g. an account without a verified email).
    const backendMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    return popupResponse('OAUTH_ERROR', {
      message: backendMessage?.includes('verified email')
        ? backendMessage
        : `Could not complete ${label} sign-in. Please try again.`,
    })
  }
}
