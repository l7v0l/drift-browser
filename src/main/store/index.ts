import Store from 'electron-store'
import { DEFAULT_SETTINGS, type HistoryEntry, type SessionData, type Settings } from '@shared/types'

interface StoreSchema {
  settings: Settings
  session: SessionData
  history: HistoryEntry[]
}

export const store = new Store<StoreSchema>({
  name: 'drift',
  defaults: { settings: DEFAULT_SETTINGS, session: { tabs: [], activeIndex: 0 }, history: [] }
})

export const getSettings = (): Settings => ({ ...DEFAULT_SETTINGS, ...store.get('settings') })

export function patchSettings(patch: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...patch }
  store.set('settings', next)
  return next
}
