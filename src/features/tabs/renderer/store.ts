import { create } from 'zustand'
import type { TabInfo, TabsState } from '@shared/types'

interface TabsStore extends TabsState {
  set: (state: TabsState) => void
}

export const useTabs = create<TabsStore>((set) => ({
  tabs: [],
  activeId: null,
  split: null,
  set: (state) => set(state)
}))

export const useActiveTab = (): TabInfo | undefined =>
  useTabs((s) => s.tabs.find((t) => t.id === s.activeId))

/** Load the current state, then follow pushes from the main process. */
export function startTabsSync(): () => void {
  void window.drift.invoke('tabs:state').then((s) => useTabs.getState().set(s))
  return window.drift.on('tabs:changed', (s) => useTabs.getState().set(s))
}
