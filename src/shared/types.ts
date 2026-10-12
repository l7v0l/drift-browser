export type Lang = 'ar' | 'en'
export type ThemeMode = 'light' | 'dark' | 'system'
export type SearchEngine = 'google' | 'bing' | 'duckduckgo'

export interface Settings {
  language: Lang
  theme: ThemeMode
  searchEngine: SearchEngine
  homepage: string
  showBookmarksBar: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'ar',
  theme: 'system',
  searchEngine: 'google',
  homepage: 'drift://newtab',
  showBookmarksBar: true
}

export interface TabInfo {
  id: number
  url: string
  title: string
  favicon: string | null
  loading: boolean
  canGoBack: boolean
  canGoForward: boolean
  pinned: boolean
  /** True when the tab has no live page (restored or unloaded) and loads on activation. */
  discarded: boolean
}

export interface TabsState {
  tabs: TabInfo[]
  activeId: number | null
}

export interface SavedTab {
  url: string
  title: string
  favicon: string | null
  pinned: boolean
}

export interface SessionData {
  tabs: SavedTab[]
  activeIndex: number
}

export interface HistoryEntry {
  url: string
  title: string
  visitedAt: number
}

export interface Suggestion {
  url: string
  title: string
  source: 'history' | 'bookmark'
}

export interface Bookmark {
  id: string
  title: string
  url: string
  createdAt: number
}

export interface ShortcutItem {
  id: string
  title: string
  url: string
}

export type ClearRange = 'hour' | 'day' | 'week' | 'all'

export type DownloadState = 'progressing' | 'completed' | 'cancelled' | 'interrupted'

export interface DownloadInfo {
  id: number
  filename: string
  url: string
  savePath: string
  received: number
  total: number
  state: DownloadState
  paused: boolean
  startedAt: number
}

export interface WindowInfo {
  private: boolean
}
