import { create } from 'zustand'
import type { Account } from '@shared/types'

export type OnboardingPhase = 'splash' | 'welcome' | 'waiting' | 'confirm' | 'done'

interface AccountStore {
  account: Account | null
  /** Account returned by the browser sign-in, waiting for the user's Save / Cancel. */
  pending: Account | null
  phase: OnboardingPhase
  error: string | null
  setAccount: (account: Account | null) => void
  set: (patch: Partial<Pick<AccountStore, 'pending' | 'phase' | 'error'>>) => void
}

export const useAccount = create<AccountStore>((set) => ({
  account: null,
  pending: null,
  phase: 'done',
  error: null,
  setAccount: (account) => set({ account }),
  set: (patch) => set(patch)
}))

export function startAccountSync(): () => void {
  void window.drift.invoke('account:get').then((a) => useAccount.getState().setAccount(a))
  return window.drift.on('account:changed', (a) => useAccount.getState().setAccount(a))
}
