import type { Bookmark, Suggestion } from '@shared/types'

export function filterBookmarks(items: Bookmark[], query: string, limit = 3): Suggestion[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return items
    .filter((b) => b.url.toLowerCase().includes(q) || b.title.toLowerCase().includes(q))
    .slice(0, limit)
    .map((b) => ({ url: b.url, title: b.title, source: 'bookmark' as const }))
}

/** Add the bookmark if the URL is new, otherwise remove it. */
export function toggleBookmark(
  items: Bookmark[],
  url: string,
  title: string,
  favicon: string | null,
  makeId: () => string,
  now: number
): Bookmark[] {
  return items.some((b) => b.url === url)
    ? items.filter((b) => b.url !== url)
    : [...items, { id: makeId(), url, title: title || url, favicon, createdAt: now }]
}
