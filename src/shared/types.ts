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
  /** True once the welcome / sign-in prompt was answered or skipped. */
  onboardingDone: boolean
  /** App version whose "What's new" window the user last saw ('' on a fresh install). */
  lastSeenVersion: string
  /** Offer to save passwords typed into sign-in forms. */
  savePasswords: boolean
  /** Fill saved passwords into sign-in forms automatically. */
  autofillPasswords: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'ar',
  theme: 'system',
  searchEngine: 'google',
  homepage: 'drift://newtab',
  showBookmarksBar: true,
  discardAfterMinutes: 30,
  onboardingDone: false,
  lastSeenVersion: '',
  savePasswords: true,
  autofillPasswords: true
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
  /** The page is playing sound right now. */
  audible: boolean
  muted: boolean
  /** True when the tab has no live page (restored or unloaded) and loads on activation. */
  discarded: boolean
}

export interface TabsState {
  tabs: TabInfo[]
  activeId: number | null
  /** Ids of the two tabs shown side by side, or null when not in split view. */
  split: [number, number] | null
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
  /** Site icon URL captured when the page was bookmarked (null if unknown yet). */
  favicon: string | null
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
  /** First normal window of this launch: shows the intro animation and welcome prompt. */
  intro: boolean
}

export type AccountProvider = 'google' | 'microsoft'

export interface Account {
  provider: AccountProvider
  email: string
  name: string
  picture: string | null
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

/** A saved login as shown in lists. The password itself is never part of this. */
export interface PasswordSummary {
  id: string
  origin: string
  username: string
  updatedAt: number
}

/** "Save / update this password?" request shown in the chrome after a sign-in form is submitted. */
export interface PasswordPrompt {
  kind: 'save' | 'update'
  origin: string
  username: string
}

/** Stored login. `passwordEnc` is the OS-encrypted password (Electron safeStorage), base64. */
export interface StoredPassword extends PasswordSummary {
  passwordEnc: string
  createdAt: number
}

export interface ExtensionSummary {
  id: string
  name: string
  version: string
  description: string
  /** Toolbar icon as a data URL (null if the extension ships none). */
  icon: string | null
  hasPopup: boolean
  optionsUrl: string | null
}
