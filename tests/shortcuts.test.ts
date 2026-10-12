import { describe, expect, it } from 'vitest'
import { matchShortcut, type KeyInput } from '@features/tabs/main/shortcuts'
import { filterHistory } from '@features/history/main/search'

const k = (key: string, o: Partial<KeyInput> = {}): KeyInput => ({
  key,
  control: false,
  meta: false,
  shift: false,
  alt: false,
  ...o
})

describe('matchShortcut', () => {
  it('maps tab shortcuts', () => {
    expect(matchShortcut(k('t', { control: true }))).toBe('new-tab')
    expect(matchShortcut(k('T', { control: true, shift: true }))).toBe('reopen-tab')
    expect(matchShortcut(k('w', { control: true }))).toBe('close-tab')
    expect(matchShortcut(k('Tab', { control: true }))).toBe('next-tab')
    expect(matchShortcut(k('Tab', { control: true, shift: true }))).toBe('prev-tab')
  })
  it('maps function keys and address focus', () => {
    expect(matchShortcut(k('F5'))).toBe('reload')
    expect(matchShortcut(k('F11'))).toBe('fullscreen')
    expect(matchShortcut(k('l', { control: true }))).toBe('focus-address')
  })
  it('ignores plain keys', () => {
    expect(matchShortcut(k('t'))).toBeNull()
  })
})

describe('filterHistory', () => {
  const e = (url: string, title: string, visitedAt: number) => ({ url, title, visitedAt })
  it('matches url or title, newest first, deduped', () => {
    const list = [
      e('https://a.com', 'Alpha', 1),
      e('https://b.com', 'Beta a', 2),
      e('https://a.com', 'Alpha', 3)
    ]
    expect(filterHistory(list, 'a').map((s) => s.url)).toEqual(['https://a.com', 'https://b.com'])
  })
  it('returns nothing for blank query', () => {
    expect(filterHistory([e('https://a.com', 'A', 1)], ' ')).toEqual([])
  })
})
