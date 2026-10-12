const HINT_PATHS: Record<string, RegExp> = {
  'accounts.google.com': /^\/(o\/oauth2\/(v2\/)?auth|signin\/oauth|v3\/signin)/,
  'login.microsoftonline.com': /\/oauth2\/(v2\.0\/)?authorize$/,
  'login.live.com': /^\/oauth20_authorize\.srf$/
}

export const LOGIN_HINT_URLS = Object.keys(HINT_PATHS).map((host) => `https://${host}/*`)

/**
 * Adds `login_hint=<email>` to a Google/Microsoft sign-in URL so the account chooser starts
 * with the user's email filled in. Returns null when the URL needs no change.
 */
export function addLoginHint(rawUrl: string, email: string): string | null {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return null
  }
  const pattern = HINT_PATHS[url.hostname]
  if (!pattern || url.protocol !== 'https:' || !pattern.test(url.pathname)) return null
  if (url.searchParams.has('login_hint')) return null
  url.searchParams.set('login_hint', email)
  return url.toString()
}
