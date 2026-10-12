export type Lang = 'ar' | 'en'
export type ThemeMode = 'light' | 'dark' | 'system'
export type SearchEngine = 'google' | 'bing' | 'duckduckgo'

export interface Settings {
  language: Lang
  theme: ThemeMode
  searchEngine: SearchEngine
  homepage: string
  showBookmarksBar: boolean
  /** Unload background tabs idle this long to free memory. 0 disables discarding. */
  discardAfterMinutes: number
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'ar',
  theme: 'system',
  searchEngine: 'google',
  homepage: 'drift://newtab',
  showBookmarksBar: true,
  discardAfterMinutes: 30
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
  /** Page zoom factor, 1 = 100%. */
  zoom: number
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

export interface FindResult {
  active: number
  total: number
}

export interface AppInfo {
  name: string
  version: string
  electron: string
  chrome: string
  node: string
}

export interface TabMemory {
  id: number
  title: string
  url: string
  /** null while the tab is discarded (no live page). */
  memoryMB: number | null
  discarded: boolean
}

export interface MemoryInfo {
  /** Whole app: browser, GPU, utility and every renderer process. */
  totalMB: number
  tabs: TabMemory[]
}
