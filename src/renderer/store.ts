import { create } from 'zustand'
import { DEFAULT_SETTINGS, type Settings } from '@shared/types'

interface SettingsState {
  settings: Settings
  load: () => Promise<void>
  update: (patch: Partial<Settings>) => Promise<void>
}

export const useSettings = create<SettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,
  load: async () => set({ settings: await window.drift.invoke('settings:get') }),
  update: async (patch) => set({ settings: await window.drift.invoke('settings:set', patch) })
}))
