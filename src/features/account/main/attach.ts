import type { Session } from 'electron'
import { addLoginHint, LOGIN_HINT_URLS } from './login-hint'

const attached = new WeakSet<Session>()

/**
 * Pre-fills the saved email on Google / Microsoft sign-in pages. The user still signs in
 * themselves; this only sets the account chooser's starting value.
 */
export function attachLoginHint(ses: Session, getEmail: () => string | null): void {
  if (attached.has(ses)) return
  attached.add(ses)
  ses.webRequest.onBeforeRequest({ urls: LOGIN_HINT_URLS }, (details, callback) => {
    const email = getEmail()
    const redirectURL = email ? addLoginHint(details.url, email) : null
    callback(redirectURL ? { redirectURL } : {})
  })
}
