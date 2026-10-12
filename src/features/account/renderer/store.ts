import { create } from 'zustand'
import type { Account, AccountProvider } from '@shared/types'

export type OnboardingPhase = 'splash' | 'welcome' | 'waiting' | 'email' | 'confirm' | 'done'

interface AccountStore {
  account: Account | null
  /** Account returned by the browser sign-in, waiting for the user's Save / Cancel. */
  pending: Account | null
  /** Provider chosen in the welcome dialog (used by the email step). */
  provider: AccountProvider | null
  phase: OnboardingPhase
  error: string | null
  setAccount: (account: Account | null) => void
  set: (patch: Partial<Pick<AccountStore, 'pending' | 'provider' | 'phase' | 'error'>>) => void
}

export const useAccount = create<AccountStore>((set) => ({
  account: null,
  pending: null,
  provider: null,
  phase: 'done',
  error: null,
  setAccount: (account) => set({ account }),
  set: (patch) => set(patch)
}))

export function startAccountSync(): () => void {
  void window.drift.invoke('account:get').then((a) => useAccount.getState().setAccount(a))
  return window.drift.on('account:changed', (a) => useAccount.getState().setAccount(a))
}
