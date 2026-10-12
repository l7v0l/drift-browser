import type { Session } from 'electron'
import { addLoginHint, mayNeedLoginHint } from '@features/account/main/login-hint'
import type { AdBlock } from '@features/adblock/main/adblock'

interface Deps {
  adblock: AdBlock
  /** Saved account email for sign-in pre-fill, or null (always null in private windows). */
  getEmail: () => string | null
}

/**
 * The single webRequest.onBeforeRequest handler of a session. Electron allows only one, so every
 * feature that looks at requests goes through here: first sign-in pre-fill, then ad blocking.
 */
export function attachRequestPipeline(ses: Session, deps: Deps): void {
  deps.adblock.attachSession(ses)
  ses.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (details, callback) => {
    if (mayNeedLoginHint(details.url)) {
      const email = deps.getEmail()
      const redirectURL = email ? addLoginHint(details.url, email) : null
      if (redirectURL) {
        callback({ redirectURL })
        return
      }
    }
    deps.adblock.filter(details, callback)
  })
}
