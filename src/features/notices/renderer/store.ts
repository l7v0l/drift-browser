import { create } from 'zustand'
import type { PasswordPrompt } from '@shared/types'

interface NoticesStore {
  password: PasswordPrompt | null
  /** Version of a downloaded update waiting for a restart. */
  update: string | null
  setPassword: (p: PasswordPrompt | null) => void
  setUpdate: (v: string | null) => void
}

export const useNotices = create<NoticesStore>((set) => ({
  password: null,
  update: null,
  setPassword: (password) => set({ password }),
  setUpdate: (update) => set({ update })
}))

export const useNoticeCount = (): number =>
  useNotices((s) => (s.password ? 1 : 0) + (s.update ? 1 : 0))

export function startNoticesSync(): () => void {
  const stops = [
    window.drift.on('passwords:prompt', (p) => useNotices.getState().setPassword(p)),
    window.drift.on('update:ready', (u) => useNotices.getState().setUpdate(u.version))
  ]
  return () => stops.forEach((stop) => stop())
}
