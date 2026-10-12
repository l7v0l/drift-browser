import { describe, expect, it } from 'vitest'
import { filterBookmarks, toggleBookmark } from '@features/bookmarks/main/search'
import { listEntries, pruneHistory } from '@features/history/main/prune'
import { isNewTabUrl } from '@shared/url'

const bm = (id: string, url: string, title: string) => ({ id, url, title, createdAt: 0 })

describe('bookmarks', () => {
  it('toggles on and off by url', () => {
    const added = toggleBookmark([], 'https://a.com', 'A', () => 'id1', 5)
    expect(added).toEqual([{ id: 'id1', url: 'https://a.com', title: 'A', createdAt: 5 }])
    expect(toggleBookmark(added, 'https://a.com', 'A', () => 'id2', 6)).toEqual([])
  })
  it('falls back to the url when the title is empty', () => {
    expect(toggleBookmark([], 'https://a.com', '', () => 'x', 0)[0].title).toBe('https://a.com')
  })
  it('filters by title or url', () => {
    const items = [bm('1', 'https://a.com', 'Alpha'), bm('2', 'https://b.com', 'Beta')]
    expect(filterBookmarks(items, 'beta').map((s) => s.url)).toEqual(['https://b.com'])
    expect(filterBookmarks(items, 'a.com')[0].source).toBe('bookmark')
  })
})

describe('history pruning', () => {
  const HOUR = 60 * 60 * 1000
  const now = 100 * HOUR
  const e = (visitedAt: number) => ({ url: `https://x/${visitedAt}`, title: 't', visitedAt })
  const entries = [e(now - 30 * HOUR), e(now - 2 * HOUR), e(now - 10 * 60 * 1000)]

  it('clears the last hour only', () => {
    expect(pruneHistory(entries, 'hour', now)).toHaveLength(2)
  })
  it('clears the last day', () => {
    expect(pruneHistory(entries, 'day', now)).toHaveLength(1)
  })
  it('clears everything', () => {
    expect(pruneHistory(entries, 'all', now)).toEqual([])
  })
  it('lists newest first with a text filter', () => {
    expect(listEntries(entries).map((x) => x.visitedAt)).toEqual(
      entries.map((x) => x.visitedAt).reverse()
    )
    expect(listEntries(entries, 'nomatch')).toEqual([])
  })
})

describe('isNewTabUrl', () => {
  it('accepts both forms', () => {
    expect(isNewTabUrl('drift://newtab')).toBe(true)
    expect(isNewTabUrl('drift://newtab/')).toBe(true)
    expect(isNewTabUrl('drift://settings')).toBe(false)
  })
})
