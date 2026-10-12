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
