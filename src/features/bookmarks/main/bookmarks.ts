import { randomUUID } from 'node:crypto'
import type { Bookmark, Suggestion } from '@shared/types'
import { store } from '../../../main/store'
import { filterBookmarks, toggleBookmark } from './search'

export const listBookmarks = (): Bookmark[] => store.get('bookmarks')

function save(items: Bookmark[]): Bookmark[] {
  store.set('bookmarks', items)
  return items
}

export const toggle = (url: string, title: string, favicon: string | null): Bookmark[] =>
  save(toggleBookmark(listBookmarks(), url, title, favicon, randomUUID, Date.now()))

/** Fill in the icon of an existing bookmark once its page reports one. Returns the new list if changed. */
export function setBookmarkFavicon(url: string, favicon: string): Bookmark[] | null {
  const items = listBookmarks()
  if (!items.some((b) => b.url === url && b.favicon !== favicon)) return null
  return save(items.map((b) => (b.url === url ? { ...b, favicon } : b)))
}

export const removeBookmark = (id: string): Bookmark[] =>
  save(listBookmarks().filter((b) => b.id !== id))

export const updateBookmark = (id: string, patch: { title?: string; url?: string }): Bookmark[] =>
  save(
    listBookmarks().map((b) =>
      b.id === id ? { ...b, title: patch.title ?? b.title, url: patch.url ?? b.url } : b
    )
  )

export const searchBookmarks = (query: string, limit?: number): Suggestion[] =>
  filterBookmarks(listBookmarks(), query, limit)
