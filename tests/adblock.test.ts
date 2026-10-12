import { describe, expect, it } from 'vitest'
import { hostOf, isAllowlisted, setAllowed } from '@shared/allowlist'

describe('allowlist', () => {
  it('matches exact hosts and their subdomains only', () => {
    const list = ['example.com']
    expect(isAllowlisted('example.com', list)).toBe(true)
    expect(isAllowlisted('news.example.com', list)).toBe(true)
    expect(isAllowlisted('notexample.com', list)).toBe(false)
    expect(isAllowlisted('example.com.evil.io', list)).toBe(false)
    expect(isAllowlisted('', list)).toBe(false)
  })
  it('adds and removes hosts, keeping the list sorted and unique', () => {
    const a = setAllowed([], 'b.com', true)
    const b = setAllowed(a, 'a.com', true)
    expect(setAllowed(b, 'a.com', true)).toEqual(['a.com', 'b.com'])
    expect(setAllowed(b, 'b.com', false)).toEqual(['a.com'])
  })
  it('reads the hostname of a url', () => {
    expect(hostOf('https://www.example.com/path?q=1')).toBe('www.example.com')
    expect(hostOf('not a url')).toBe('')
  })
})
