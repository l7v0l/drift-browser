import { create } from 'zustand'
import type { ExtensionSummary } from '@shared/types'

interface ExtensionsStore {
  items: ExtensionSummary[]
  set: (items: ExtensionSummary[]) => void
}

export const useExtensions = create<ExtensionsStore>((set) => ({
  items: [],
  set: (items) => set({ items })
}))

export function startExtensionsSync(): () => void {
  void window.drift.invoke('extensions:list').then((i) => useExtensions.getState().set(i))
  return window.drift.on('extensions:changed', (i) => useExtensions.getState().set(i))
}
