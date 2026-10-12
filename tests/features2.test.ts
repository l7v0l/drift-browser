import { describe, expect, it } from 'vitest'
import { parseExtensionId } from '@features/extensions/main/id'
import {
  decideCapture,
  isSecureOrigin,
  pickCredentials,
  type FieldInfo
} from '@features/passwords/main/decide'
import { changelogSince, compareVersions } from '@shared/changelog'
import { matchShortcut } from '@features/tabs/main/shortcuts'

const text = (value: string, extra: Partial<FieldInfo> = {}): FieldInfo => ({
  kind: 'text',
  value,
  visible: true,
  ...extra
})
const pass = (value: string): FieldInfo => ({ kind: 'password', value, visible: true })

describe('pickCredentials', () => {
  it('reads a plain login form', () => {
    expect(pickCredentials([text('me@x.com', { name: 'email' }), pass('s3cret')])).toEqual({
      username: 'me@x.com',
      password: 's3cret'
    })
  })
  it('ignores empty or hidden password fields', () => {
    expect(pickCredentials([text('a'), pass('')])).toBeNull()
    expect(pickCredentials([text('a'), { ...pass('x'), visible: false }])).toBeNull()
  })
  it('uses the new password on sign-up and change-password forms', () => {
    expect(pickCredentials([text('u'), pass('same'), pass('same')])?.password).toBe('same')
    expect(pickCredentials([pass('old'), pass('new'), pass('new')])?.password).toBe('new')
  })
  it('prefers the autocomplete=username field', () => {
    const fields = [text('noise'), text('real', { autocomplete: 'username' }), pass('p')]
    expect(pickCredentials(fields)?.username).toBe('real')
  })
  it('allows a missing username', () => {
    expect(pickCredentials([pass('p')])).toEqual({ username: '', password: 'p' })
  })
})

describe('decideCapture', () => {
  const base = { enabled: true, neverSaved: false, username: 'u', password: 'p', existing: [] }
  it('saves new logins', () => expect(decideCapture(base)).toBe('save'))
  it('ignores when disabled, never-saved or empty', () => {
    expect(decideCapture({ ...base, enabled: false })).toBe('ignore')
    expect(decideCapture({ ...base, neverSaved: true })).toBe('ignore')
    expect(decideCapture({ ...base, password: '' })).toBe('ignore')
  })
  it('updates a changed password and ignores an identical one', () => {
    expect(decideCapture({ ...base, existing: [{ username: 'u', samePassword: false }] })).toBe(
      'update'
    )
    expect(decideCapture({ ...base, existing: [{ username: 'u', samePassword: true }] })).toBe(
      'ignore'
    )
  })
})

describe('isSecureOrigin', () => {
  it('allows https and localhost only', () => {
    expect(isSecureOrigin('https://a.com')).toBe(true)
    expect(isSecureOrigin('http://localhost:3000')).toBe(true)
    expect(isSecureOrigin('http://a.com')).toBe(false)
    expect(isSecureOrigin('not a url')).toBe(false)
  })
})

describe('changelog', () => {
  it('compares versions numerically', () => {
    expect(compareVersions('0.10.0', '0.9.0')).toBeGreaterThan(0)
    expect(compareVersions('1.0', '1.0.0')).toBe(0)
  })
  it('lists entries newer than the last seen version', () => {
    expect(changelogSince('0.1.3', '0.2.0').map((e) => e.version)).toEqual(['0.2.0'])
    expect(changelogSince('0.2.0', '0.2.0')).toEqual([])
    expect(changelogSince('0.1.0', '0.1.5')).toEqual([])
  })
})

describe('parseExtensionId', () => {
  const id = 'ddkjiahejlhfcafbddmgiahcphecmpfh'
  it('reads an id from a bare id or a store url', () => {
    expect(parseExtensionId(id)).toBe(id)
    expect(
      parseExtensionId(`https://chromewebstore.google.com/detail/ublock-origin-lite/${id}`)
    ).toBe(id)
    expect(parseExtensionId('hello')).toBeNull()
  })
})

describe('new shortcuts', () => {
  const k = (key: string, o: object = {}) => ({
    key,
    control: true,
    meta: false,
    shift: false,
    alt: false,
    ...o
  })
  it('maps library and tool shortcuts', () => {
    expect(matchShortcut(k('h'))).toBe('history')
    expect(matchShortcut(k('j'))).toBe('downloads')
    expect(matchShortcut(k('O', { shift: true }))).toBe('bookmarks')
    expect(matchShortcut(k('p'))).toBe('print')
    expect(matchShortcut(k('F12', { control: false }))).toBe('devtools')
  })
})
