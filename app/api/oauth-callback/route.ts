export async function GET(request: Request) {
  const url = new URL(request.url)
  const accessToken = url.searchParams.get('accessToken') || ''
  const expiresAt = url.searchParams.get('expiresAt') || ''

  if (!accessToken) {
    return new Response(
      `<!DOCTYPE html>
<html>
<head>
  <title>Authentication Failed</title>
</head>
<body>
  <script>
    if (window.opener) {
      window.opener.postMessage({ type: 'OAUTH_ERROR', message: 'Missing token' }, window.location.origin);
      window.close();
    } else {
      window.location.href = '/';
    }
  </script>
  <p>Authentication failed. Missing token.</p>
</body>
</html>`,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    )
  }

  return new Response(
    `<!DOCTYPE html>
<html>
<head>
  <title>Authenticating...</title>
</head>
<body>
  <script>
    if (window.opener) {
      window.opener.postMessage({ 
        type: 'OAUTH_SUCCESS', 
        payload: { 
          accessToken: ${JSON.stringify(accessToken)}, 
          expiresAt: ${JSON.stringify(expiresAt)} 
        }
      }, window.location.origin);
      window.close();
    } else {
      window.location.href = '/';
    }
  </script>
  <p>Authenticating...</p>
</body>
</html>`,
    {
      headers: { 'Content-Type': 'text/html' },
    }
  )
}
