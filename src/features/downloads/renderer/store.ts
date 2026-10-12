import { create } from 'zustand'
import type { DownloadInfo } from '@shared/types'

interface DownloadsStore {
  items: DownloadInfo[]
  set: (items: DownloadInfo[]) => void
}

export const useDownloads = create<DownloadsStore>((set) => ({
  items: [],
  set: (items) => set({ items })
}))

export function startDownloadsSync(): () => void {
  void window.drift.invoke('downloads:list').then((items) => useDownloads.getState().set(items))
  return window.drift.on('downloads:changed', (items) => useDownloads.getState().set(items))
}
