import { create } from 'zustand'
import type { FindResult } from '@shared/types'

interface FindStore {
  open: boolean
  result: FindResult
  setOpen: (open: boolean) => void
  setResult: (result: FindResult) => void
}

export const useFind = create<FindStore>((set) => ({
  open: false,
  result: { active: 0, total: 0 },
  setOpen: (open) => set({ open, result: { active: 0, total: 0 } }),
  setResult: (result) => set({ result })
}))
