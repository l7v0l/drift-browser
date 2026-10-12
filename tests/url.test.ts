import { describe, expect, it } from 'vitest'
import { resolveInput } from '@shared/url'

describe('resolveInput', () => {
  it('keeps full URLs', () => {
    expect(resolveInput('https://a.com/x', 'google')).toBe('https://a.com/x')
  })
  it('adds https to bare domains', () => {
    expect(resolveInput('example.com', 'google')).toBe('https://example.com')
  })
  it('uses http for localhost', () => {
    expect(resolveInput('localhost:3000', 'google')).toBe('http://localhost:3000')
  })
  it('searches plain text', () => {
    expect(resolveInput('hello world', 'duckduckgo')).toBe(
      'https://duckduckgo.com/?q=hello%20world'
    )
  })
  it('returns empty for blank', () => {
    expect(resolveInput('  ', 'bing')).toBe('')
  })
})
