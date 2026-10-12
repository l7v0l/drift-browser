import { create } from 'zustand'
import type { Bookmark } from '@shared/types'

interface BookmarksStore {
  items: Bookmark[]
  set: (items: Bookmark[]) => void
}

export const useBookmarks = create<BookmarksStore>((set) => ({
  items: [],
  set: (items) => set({ items })
}))

/** Load bookmarks, then follow changes pushed from any window. */
export function startBookmarksSync(): () => void {
  void window.drift.invoke('bookmarks:list').then((items) => useBookmarks.getState().set(items))
  return window.drift.on('bookmarks:changed', (items) => useBookmarks.getState().set(items))
}
