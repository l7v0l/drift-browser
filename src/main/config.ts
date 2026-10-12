import type { AccountProvider } from '@shared/types'
import type { ProviderConfig } from '@features/account/main/providers'

/**
 * OAuth client ids are public identifiers but belong to whoever registers the app, so they are
 * injected at build time from .env (MAIN_VITE_*) and are not part of the repository.
 * See docs/SIGN_IN.md.
 */
export const oauthConfig: Record<AccountProvider, ProviderConfig> = {
  google: {
    clientId: import.meta.env.MAIN_VITE_GOOGLE_CLIENT_ID ?? '',
    clientSecret: import.meta.env.MAIN_VITE_GOOGLE_CLIENT_SECRET ?? ''
  },
  microsoft: {
    clientId: import.meta.env.MAIN_VITE_MICROSOFT_CLIENT_ID ?? ''
  }
}
