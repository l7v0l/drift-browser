import type { Account, AccountProvider } from '@shared/types'

export interface ProviderConfig {
  clientId: string
  /** Google "Desktop app" clients still require a (non-confidential) secret; Microsoft has none. */
  clientSecret?: string
}

interface Endpoints {
  authorize: string
  token: string
  userinfo: string
  /** Loopback host the provider accepts for native-app redirects. */
  loopbackHost: string
}

export const ENDPOINTS: Record<AccountProvider, Endpoints> = {
  google: {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    userinfo: 'https://openidconnect.googleapis.com/v1/userinfo',
    loopbackHost: '127.0.0.1'
  },
  microsoft: {
    authorize: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userinfo: 'https://graph.microsoft.com/oidc/userinfo',
    loopbackHost: 'localhost'
  }
}

const SCOPE = 'openid email profile'

export function buildAuthUrl(
  provider: AccountProvider,
  clientId: string,
  redirectUri: string,
  state: string,
  challenge: string
): string {
  const url = new URL(ENDPOINTS[provider].authorize)
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPE,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account'
  }).toString()
  return url.toString()
}

export function buildTokenBody(
  provider: AccountProvider,
  config: ProviderConfig,
  code: string,
  verifier: string,
  redirectUri: string
): URLSearchParams {
  const body = new URLSearchParams({
    client_id: config.clientId,
    code,
    code_verifier: verifier,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  })
  if (provider === 'google' && config.clientSecret) body.set('client_secret', config.clientSecret)
  return body
}

/** Reads the OpenID userinfo response. Throws when the provider returned no email. */
export function parseProfile(provider: AccountProvider, info: Record<string, unknown>): Account {
  const str = (v: unknown): string => (typeof v === 'string' ? v : '')
  const email = str(info.email) || str(info.preferred_username)
  if (!email.includes('@')) throw new Error('no-email')
  return {
    provider,
    email,
    name: str(info.name) || email,
    picture: str(info.picture) || null
  }
}
