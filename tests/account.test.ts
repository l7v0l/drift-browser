import { describe, expect, it } from 'vitest'
import { startLoopback } from '@features/account/main/loopback'
import { addLoginHint } from '@features/account/main/login-hint'
import { createChallenge, createState, createVerifier } from '@features/account/main/pkce'
import { buildAuthUrl, buildTokenBody, parseProfile } from '@features/account/main/providers'

describe('pkce', () => {
  it('derives the RFC 7636 S256 challenge', () => {
    // Test vector from RFC 7636 appendix B.
    expect(createChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
    )
  })
  it('generates unique url-safe values', () => {
    expect(createVerifier()).toMatch(/^[A-Za-z0-9_-]{43,128}$/)
    expect(createState()).not.toBe(createState())
  })
})

describe('providers', () => {
  it('builds an authorization url with PKCE and no secret', () => {
    const url = new URL(buildAuthUrl('google', 'cid', 'http://127.0.0.1:5000', 'st', 'ch'))
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth')
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.get('state')).toBe('st')
    expect(url.searchParams.get('client_secret')).toBeNull()
  })
  it('sends the secret only for Google', () => {
    const cfg = { clientId: 'cid', clientSecret: 'sec' }
    expect(buildTokenBody('google', cfg, 'c', 'v', 'r').get('client_secret')).toBe('sec')
    expect(buildTokenBody('microsoft', cfg, 'c', 'v', 'r').has('client_secret')).toBe(false)
  })
  it('parses a profile and rejects missing email', () => {
    expect(parseProfile('google', { email: 'a@b.com', name: 'A', picture: 'p' })).toEqual({
      provider: 'google',
      email: 'a@b.com',
      name: 'A',
      picture: 'p'
    })
    expect(parseProfile('microsoft', { preferred_username: 'x@hotmail.com' }).name).toBe(
      'x@hotmail.com'
    )
    expect(() => parseProfile('google', { name: 'no email' })).toThrow('no-email')
  })
})

describe('addLoginHint', () => {
  it('adds the hint to Google and Microsoft sign-in urls', () => {
    const g = addLoginHint(
      'https://accounts.google.com/o/oauth2/v2/auth?client_id=1',
      'me@gmail.com'
    )
    expect(new URL(g!).searchParams.get('login_hint')).toBe('me@gmail.com')
    const m = addLoginHint(
      'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=1',
      'me@hotmail.com'
    )
    expect(new URL(m!).searchParams.get('login_hint')).toBe('me@hotmail.com')
  })
  it('leaves other urls and existing hints alone', () => {
    expect(addLoginHint('https://example.com/o/oauth2/v2/auth', 'a@b.c')).toBeNull()
    expect(
      addLoginHint('https://accounts.google.com/o/oauth2/v2/auth?login_hint=x', 'a@b.c')
    ).toBeNull()
    expect(addLoginHint('http://accounts.google.com/o/oauth2/v2/auth', 'a@b.c')).toBeNull()
    expect(addLoginHint('https://accounts.google.com/', 'a@b.c')).toBeNull()
  })
})

describe('loopback server', () => {
  it('resolves with the code when the state matches', async () => {
    const lb = await startLoopback('good')
    const res = await fetch(`${lb.redirectUri}/?code=abc&state=good`)
    expect(res.status).toBe(200)
    await expect(lb.code).resolves.toBe('abc')
  })
  it('rejects on a state mismatch', async () => {
    const lb = await startLoopback('good')
    await fetch(`${lb.redirectUri}/?code=abc&state=evil`)
    await expect(lb.code).rejects.toThrow('state-mismatch')
  })
  it('rejects when cancelled and ignores unrelated requests', async () => {
    const lb = await startLoopback('good')
    expect((await fetch(`${lb.redirectUri}/favicon.ico`)).status).toBe(404)
    lb.close()
    await expect(lb.code).rejects.toThrow('cancelled')
  })
})
