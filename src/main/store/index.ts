import Store from 'electron-store'
import {
  DEFAULT_SETTINGS,
  type Account,
  type Bookmark,
  type DownloadInfo,
  type HistoryEntry,
  type SessionData,
  type StoredPassword,
  type Settings,
  type ShortcutItem
} from '@shared/types'

interface StoreSchema {
  settings: Settings
  session: SessionData
  history: HistoryEntry[]
  bookmarks: Bookmark[]
  shortcuts: ShortcutItem[]
  downloads: DownloadInfo[]
  account: Account | null
  passwords: StoredPassword[]
  neverSavePasswords: string[]
}

export const store = new Store<StoreSchema>({
  name: 'drift',
  defaults: {
    settings: DEFAULT_SETTINGS,
    session: { tabs: [], activeIndex: 0 },
    history: [],
    bookmarks: [],
    shortcuts: [
      { id: 'google', title: 'Google', url: 'https://www.google.com' },
      { id: 'youtube', title: 'YouTube', url: 'https://www.youtube.com' },
      { id: 'wikipedia', title: 'Wikipedia', url: 'https://www.wikipedia.org' },
      { id: 'github', title: 'GitHub', url: 'https://github.com' }
    ],
    downloads: [],
    account: null,
    passwords: [],
    neverSavePasswords: []
  }
})

export const getSettings = (): Settings => ({ ...DEFAULT_SETTINGS, ...store.get('settings') })

export function patchSettings(patch: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...patch }
  store.set('settings', next)
  return next
}
