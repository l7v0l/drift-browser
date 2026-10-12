import Store from 'electron-store'
import { DEFAULT_SETTINGS, type Settings } from '@shared/types'

interface StoreSchema {
  settings: Settings
}

export const store = new Store<StoreSchema>({
  name: 'drift',
  defaults: { settings: DEFAULT_SETTINGS }
})

export const getSettings = (): Settings => ({ ...DEFAULT_SETTINGS, ...store.get('settings') })

export function patchSettings(patch: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...patch }
  store.set('settings', next)
  return next
}
