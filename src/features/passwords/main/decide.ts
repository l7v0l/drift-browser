/** A form control as seen by the content script, in document order. */
export interface FieldInfo {
  kind: 'password' | 'text'
  value: string
  name?: string
  autocomplete?: string
  visible: boolean
}

export interface Credentials {
  username: string
  password: string
}

const USERNAME_HINT = /user|email|login|account|phone|mobile/i

/**
 * Pick the login out of a submitted form. Sign-up forms repeat the password (confirm field) and
 * change-password forms have current + new + confirm, so the new password is the second one when
 * there are three.
 */
export function pickCredentials(fields: FieldInfo[]): Credentials | null {
  const passwords = fields
    .map((f, i) => ({ f, i }))
    .filter(({ f }) => f.kind === 'password' && f.visible && f.value !== '')
  if (passwords.length === 0) return null

  let password = passwords[0].f.value
  if (passwords.length >= 3) password = passwords[1].f.value
  else if (passwords.length === 2 && passwords[0].f.value !== passwords[1].f.value) {
    password = passwords[1].f.value
  }

  // Username: the closest filled text field before the first password field.
  const firstPassword = passwords[0].i
  const candidates = fields
    .slice(0, firstPassword)
    .filter((f) => f.kind === 'text' && f.visible && f.value.trim() !== '')
  const preferred =
    [...candidates]
      .reverse()
      .find((f) => f.autocomplete === 'username' || f.autocomplete === 'email') ??
    [...candidates].reverse().find((f) => USERNAME_HINT.test(f.name ?? '')) ??
    candidates[candidates.length - 1]
  return { username: preferred?.value.trim() ?? '', password }
}

export type CaptureDecision = 'ignore' | 'save' | 'update'

export interface ExistingLogin {
  username: string
  /** True when the stored password equals the submitted one. */
  samePassword: boolean
}

export function decideCapture(input: {
  enabled: boolean
  neverSaved: boolean
  username: string
  password: string
  existing: ExistingLogin[]
}): CaptureDecision {
  if (!input.enabled || input.neverSaved || input.password === '') return 'ignore'
  const match = input.existing.find((e) => e.username === input.username)
  if (!match) return 'save'
  return match.samePassword ? 'ignore' : 'update'
}

/** Passwords are only saved and filled on HTTPS pages (and localhost for development). */
export function isSecureOrigin(origin: string): boolean {
  try {
    const url = new URL(origin)
    return url.protocol === 'https:' || (url.protocol === 'http:' && url.hostname === 'localhost')
  } catch {
    return false
  }
}
