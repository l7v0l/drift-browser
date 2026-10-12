import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@renderer/components/Icon'
import { useOverlay } from '@renderer/hooks/useOverlay'
import { useAccount } from './store'

const call = window.drift.invoke

export function AccountButton() {
  const { t } = useTranslation()
  const account = useAccount((s) => s.account)
  const set = useAccount((s) => s.set)
  const [open, setOpen] = useState(false)
  useOverlay(open)

  return (
    <div className="relative">
      <button
        aria-label={t('account.title')}
        title={account ? account.email : t('account.title')}
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150 hover:bg-surface-3"
      >
        {account ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-ink">
            {account.name.slice(0, 1).toUpperCase()}
          </span>
        ) : (
          <Icon name="user" />
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0" onMouseDown={() => setOpen(false)} />
          <div className="absolute end-0 top-10 z-50 w-64 rounded-2xl border border-line bg-surface p-3 shadow-lg">
            {account ? (
              <>
                <div className="truncate font-semibold">{account.name}</div>
                <div className="mb-3 truncate text-muted" dir="ltr">
                  {account.email}
                </div>
                <button
                  onClick={() => {
                    void call('account:sign-out')
                    setOpen(false)
                  }}
                  className="w-full rounded-full border border-line px-3 py-1.5 transition-colors duration-150 hover:bg-surface-2"
                >
                  {t('account.signOut')}
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  set({ phase: 'welcome', error: null })
                  setOpen(false)
                }}
                className="w-full rounded-full bg-accent px-3 py-1.5 text-accent-ink transition-opacity duration-150 hover:opacity-90"
              >
                {t('account.signIn')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
