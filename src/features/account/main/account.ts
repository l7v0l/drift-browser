import { shell } from 'electron'
import type { Account, AccountProvider } from '@shared/types'
import { store } from '../../../main/store'
import { startLoopback, type Loopback } from './loopback'
import { createChallenge, createState, createVerifier } from './pkce'
import {
  buildAuthUrl,
  buildTokenBody,
  ENDPOINTS,
  parseProfile,
  type ProviderConfig
} from './providers'

type Configs = Record<AccountProvider, ProviderConfig>

/**
 * Sign-in with Google / Microsoft via the system browser (OAuth code flow + PKCE).
 * Only the profile (email, name, picture) is kept, and only when the user confirms "Save".
 * No tokens or passwords are stored.
 */
export class AccountService {
  private current: Account | null = store.get('account')
  private pending: Account | null = null
  private loopback: Loopback | null = null

  constructor(
    private readonly configs: Configs,
    private readonly onChange: (account: Account | null) => void
  ) {}

  get = (): Account | null => this.current

  async signIn(provider: AccountProvider): Promise<Account> {
    const config = this.configs[provider]
    if (!config.clientId) throw new Error('not-configured')
    this.cancel()

    const state = createState()
    const verifier = createVerifier()
    const loopback = await startLoopback(state, ENDPOINTS[provider].loopbackHost)
    this.loopback = loopback

    try {
      const authUrl = buildAuthUrl(
        provider,
        config.clientId,
        loopback.redirectUri,
        state,
        createChallenge(verifier)
      )
      await shell.openExternal(authUrl)
      const code = await loopback.code
      const body = buildTokenBody(provider, config, code, verifier, loopback.redirectUri)

      const tokenRes = await fetch(ENDPOINTS[provider].token, { method: 'POST', body })
      if (!tokenRes.ok) throw new Error('token-exchange-failed')
      const { access_token } = (await tokenRes.json()) as { access_token?: string }
      if (!access_token) throw new Error('token-exchange-failed')

      const infoRes = await fetch(ENDPOINTS[provider].userinfo, {
        headers: { authorization: `Bearer ${access_token}` }
      })
      if (!infoRes.ok) throw new Error('userinfo-failed')
      this.pending = parseProfile(provider, (await infoRes.json()) as Record<string, unknown>)
      return this.pending
    } finally {
      if (this.loopback === loopback) this.loopback = null
      loopback.close()
    }
  }

  /** Save: keep the account on this device. Cancel: discard the sign-in. */
  confirm(save: boolean): Account | null {
    if (this.pending && save) {
      this.current = this.pending
      store.set('account', this.current)
      this.onChange(this.current)
    }
    this.pending = null
    return this.current
  }

  /** Abort a sign-in that is waiting for the browser. */
  cancel(): void {
    this.loopback?.close()
    this.loopback = null
    this.pending = null
  }

  signOut(): void {
    this.cancel()
    this.current = null
    store.set('account', null)
    this.onChange(null)
  }
}
