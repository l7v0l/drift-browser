import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useOverlay } from '@renderer/hooks/useOverlay'
import { Splash } from '@features/splash/renderer/Splash'
import type { Account, AccountProvider } from '@shared/types'
import { useAccount } from './store'

const call = window.drift.invoke
const SPLASH_MS = 2600
const SPLASH_FADE_MS = 500

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-6">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 shadow-lg">
        {children}
      </div>
    </div>
  )
}

function ProviderButton(props: { provider: AccountProvider; label: string; onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      className="flex w-full items-center justify-center gap-3 rounded-full border border-line bg-surface-2 px-4 py-2.5 transition-colors duration-150 hover:bg-surface-3"
    >
      {props.provider === 'google' ? (
        <span className="text-lg font-bold text-[#4285F4]">G</span>
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <rect width="8.5" height="8.5" fill="#F25022" />
          <rect x="9.5" width="8.5" height="8.5" fill="#7FBA00" />
          <rect y="9.5" width="8.5" height="8.5" fill="#00A4EF" />
          <rect x="9.5" y="9.5" width="8.5" height="8.5" fill="#FFB900" />
        </svg>
      )}
      <span>{props.label}</span>
    </button>
  )
}

function Avatar({ account }: { account: Account }) {
  return account.picture ? (
    <img
      src={account.picture}
      alt=""
      className="h-12 w-12 rounded-full"
      referrerPolicy="no-referrer"
    />
  ) : (
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-semibold text-accent-ink">
      {account.name.slice(0, 1).toUpperCase()}
    </span>
  )
}

/** Splash animation, then the optional sign-in prompt, then a Save / Cancel confirmation. */
export function Onboarding({ intro }: { intro: boolean }) {
  const { t } = useTranslation()
  const { phase, pending, error, set } = useAccount()
  const showSplash = phase === 'splash'
  useOverlay(phase !== 'done')

  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!intro) return
    set({ phase: 'splash' })
    const fade = window.setTimeout(() => setLeaving(true), SPLASH_MS)
    const next = window.setTimeout(async () => {
      const [settings, account] = await Promise.all([call('settings:get'), call('account:get')])
      set({ phase: !account && !settings.onboardingDone ? 'welcome' : 'done' })
    }, SPLASH_MS + SPLASH_FADE_MS)
    return () => {
      window.clearTimeout(fade)
      window.clearTimeout(next)
    }
  }, [intro, set])

  const finish = () => {
    void call('settings:set', { onboardingDone: true })
    set({ phase: 'done', pending: null, error: null })
  }

  const signIn = async (provider: AccountProvider) => {
    set({ phase: 'waiting', error: null })
    try {
      set({ pending: await call('account:sign-in', provider), phase: 'confirm' })
    } catch (e) {
      const message = e instanceof Error ? e.message : ''
      const cancelled = message.includes('cancelled')
      set({
        phase: 'welcome',
        error: cancelled
          ? null
          : message.includes('not-configured')
            ? t('account.notConfigured')
            : t('account.failed')
      })
    }
  }

  const confirm = async (save: boolean) => {
    await call('account:confirm', save)
    finish()
  }

  if (phase === 'done') return null

  if (showSplash) return <Splash leaving={leaving} />

  if (phase === 'welcome') {
    return (
      <Card>
        <h2 className="mb-1 text-xl font-semibold">{t('account.welcomeTitle')}</h2>
        <p className="mb-5 text-muted">{t('account.welcomeText')}</p>
        <div className="flex flex-col gap-2">
          <ProviderButton
            provider="google"
            label={t('account.google')}
            onClick={() => void signIn('google')}
          />
          <ProviderButton
            provider="microsoft"
            label={t('account.microsoft')}
            onClick={() => void signIn('microsoft')}
          />
        </div>
        {error && <p className="mt-3 text-sm text-[#d4482a]">{error}</p>}
        <button
          onClick={finish}
          className="mt-4 w-full rounded-full px-4 py-2 text-muted transition-colors duration-150 hover:bg-surface-2"
        >
          {t('account.notNow')}
        </button>
      </Card>
    )
  }

  if (phase === 'waiting') {
    return (
      <Card>
        <p className="mb-5 text-center">{t('account.waiting')}</p>
        <button
          onClick={() => void call('account:cancel')}
          className="w-full rounded-full border border-line px-4 py-2 transition-colors duration-150 hover:bg-surface-2"
        >
          {t('common.cancel')}
        </button>
      </Card>
    )
  }

  if (phase === 'confirm' && pending) {
    return (
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <Avatar account={pending} />
          <div className="min-w-0">
            <div className="truncate font-semibold">{pending.name}</div>
            <div className="truncate text-muted" dir="ltr">
              {pending.email}
            </div>
          </div>
        </div>
        <p className="mb-5">{t('account.saveQuestion')}</p>
        <div className="flex gap-2">
          <button
            onClick={() => void confirm(true)}
            className="flex-1 rounded-full bg-accent px-4 py-2 text-accent-ink transition-opacity duration-150 hover:opacity-90"
          >
            {t('account.save')}
          </button>
          <button
            onClick={() => void confirm(false)}
            className="flex-1 rounded-full border border-line px-4 py-2 transition-colors duration-150 hover:bg-surface-2"
          >
            {t('common.cancel')}
          </button>
        </div>
      </Card>
    )
  }

  return null
}
