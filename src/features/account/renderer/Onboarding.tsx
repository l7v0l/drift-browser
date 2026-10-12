import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useOverlay } from '@renderer/hooks/useOverlay'
import { changelogSince, type ChangelogEntry } from '@shared/changelog'
import type { Account, AccountProvider } from '@shared/types'
import { useAccount } from './store'

const call = window.drift.invoke

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-card border border-line bg-surface p-6 shadow-modal">
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
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
        </svg>
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

function EmailStep(props: {
  provider: AccountProvider | null
  error: string | null
  onSubmit: (email: string) => void
  onBack: () => void
}) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const name = props.provider === 'microsoft' ? 'Microsoft' : 'Google'
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        props.onSubmit(email)
      }}
    >
      <h2 className="mb-1 text-xl font-semibold">{t('account.emailTitle', { provider: name })}</h2>
      <p className="mb-4 text-muted">{t('account.emailText')}</p>
      <input
        autoFocus
        type="email"
        dir="ltr"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={props.provider === 'microsoft' ? 'name@hotmail.com' : 'name@gmail.com'}
        className="w-full rounded-full border border-line bg-surface-2 px-4 py-2.5 outline-none focus:ring-[3px] focus:ring-ring focus:border-accent"
        style={{ userSelect: 'text' }}
      />
      {props.error && <p className="mt-2 text-sm text-[#d4482a]">{props.error}</p>}
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-full bg-coral px-4 py-2 text-white transition-opacity duration-150 hover:opacity-90"
        >
          {t('account.continue')}
        </button>
        <button
          type="button"
          onClick={props.onBack}
          className="flex-1 rounded-full border border-line px-4 py-2 transition-colors duration-150 hover:bg-surface-2"
        >
          {t('account.back')}
        </button>
      </div>
    </form>
  )
}

/** Splash animation, then the optional sign-in prompt, then a Save / Cancel confirmation. */
export function Onboarding({ intro }: { intro: boolean }) {
  const { t } = useTranslation()
  const { phase, pending, provider, error, set } = useAccount()
  const { i18n } = useTranslation()
  const [news, setNews] = useState<ChangelogEntry[]>([])
  useOverlay(phase !== 'done')

  /** After sign-in is settled: show what changed since the last seen version, or just continue. */
  const showNewsOrDone = async () => {
    const [settings, info] = await Promise.all([call('settings:get'), call('app:info')])
    if (settings.lastSeenVersion === '') {
      void call('settings:set', { lastSeenVersion: info.version }) // fresh install: nothing to explain
    } else {
      const entries = changelogSince(settings.lastSeenVersion, info.version)
      if (entries.length > 0) {
        setNews(entries)
        set({ phase: 'whatsnew' })
        return
      }
    }
    set({ phase: 'done', pending: null, error: null })
  }

  useEffect(() => {
    if (!intro) return
    void Promise.all([call('settings:get'), call('account:get')]).then(([settings, account]) => {
      if (!account && !settings.onboardingDone) set({ phase: 'welcome' })
      else void showNewsOrDone()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intro, set])

  const finish = () => {
    void call('settings:set', { onboardingDone: true })
    void showNewsOrDone()
  }

  const signIn = async (provider: AccountProvider) => {
    set({ phase: 'waiting', error: null, provider })
    try {
      set({ pending: await call('account:sign-in', provider), phase: 'confirm' })
    } catch (e) {
      const message = e instanceof Error ? e.message : ''
      // No OAuth client id in this build: fall back to typing the email address.
      if (message.includes('not-configured')) return set({ phase: 'email', error: null })
      set({ phase: 'welcome', error: message.includes('cancelled') ? null : t('account.failed') })
    }
  }

  const submitEmail = async (email: string) => {
    const provider = useAccount.getState().provider
    if (!provider) return
    try {
      set({
        pending: await call('account:use-email', provider, email),
        phase: 'confirm',
        error: null
      })
    } catch {
      set({ error: t('account.invalidEmail') })
    }
  }

  const confirm = async (save: boolean) => {
    await call('account:confirm', save)
    finish()
  }

  if (phase === 'done') return null

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

  if (phase === 'email') {
    return (
      <Card>
        <EmailStep
          provider={provider}
          error={error}
          onSubmit={(email) => void submitEmail(email)}
          onBack={() => set({ phase: 'welcome', error: null })}
        />
      </Card>
    )
  }

  if (phase === 'whatsnew') {
    const lang = i18n.language === 'en' ? 'en' : 'ar'
    const dismiss = async () => {
      const info = await call('app:info')
      await call('settings:set', { lastSeenVersion: info.version })
      set({ phase: 'done', pending: null, error: null })
    }
    return (
      <Card>
        <h2 className="mb-3 text-xl font-semibold">{t('whatsNew.title')}</h2>
        <div className="max-h-80 overflow-y-auto">
          {news.map((entry) => (
            <section key={entry.version} className="mb-3">
              <h3 className="mb-1 font-semibold text-accent">
                <span className="font-label" dir="ltr">
                  v{entry.version}
                </span>
              </h3>
              <ul className="list-disc space-y-1 ps-5 text-muted">
                {entry.items.map((item) => (
                  <li key={item.en}>{item[lang]}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <button
          onClick={() => void dismiss()}
          className="mt-4 w-full rounded-full bg-coral px-4 py-2 text-white transition-opacity duration-150 hover:opacity-90"
        >
          {t('whatsNew.close')}
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
            className="flex-1 rounded-full bg-coral px-4 py-2 text-white transition-opacity duration-150 hover:opacity-90"
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
