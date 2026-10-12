import type { Suggestion } from '@shared/types'
import { searchBookmarks } from '../../bookmarks/main/bookmarks'
import { searchHistory } from '../../history/main/history'

export function suggest(text: string): Suggestion[] {
  const bookmarks = searchBookmarks(text, 3)
  const seen = new Set(bookmarks.map((b) => b.url))
  const history = searchHistory(text, 8).filter((h) => !seen.has(h.url))
  return [...bookmarks, ...history].slice(0, 6)
}
