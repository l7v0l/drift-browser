import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@renderer/components/Icon'
import { useOverlay } from '@renderer/hooks/useOverlay'
import { useSettings } from '@renderer/store'
import { useActiveTab } from '@features/tabs/renderer/store'
import { hostOf, isAllowlisted, setAllowed } from '@shared/allowlist'

const call = window.drift.invoke

function Switch(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 py-1.5">
      <span>{props.label}</span>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        className="h-5 w-5 accent-[var(--accent)]"
      />
    </label>
  )
}

/** Shield in the toolbar: blocked count for this page, and per-site / global switches. */
export function AdBlockButton() {
  const { t } = useTranslation()
  const tab = useActiveTab()
  const { settings, update } = useSettings()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading')
  useOverlay(open)

  useEffect(() => {
    if (open) void call('adblock:status').then(setStatus)
  }, [open])

  const url = tab?.url ?? ''
  const web = /^https?:/i.test(url)
  const host = web ? hostOf(url) : ''
  const siteAllowed = isAllowlisted(host, settings.adblockAllowlist)
  const active = settings.adblockEnabled && !siteAllowed
  const blocked = tab?.blocked ?? 0

  const toggleSite = (block: boolean) => {
    void update({ adblockAllowlist: setAllowed(settings.adblockAllowlist, host, !block) })
    void call('tabs:reload') // apply to the current page
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        aria-label={t('adblock.title')}
        title={t('adblock.title')}
        onClick={() => setOpen(!open)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150 hover:bg-surface-3"
      >
        <Icon name="shield" className={active ? 'text-accent' : 'text-muted'} />
        {active && blocked > 0 && (
          <span
            className="absolute -end-0.5 -top-0.5 min-w-4 rounded-full bg-coral px-1 text-center font-label text-[10px] font-semibold leading-4 text-white"
            dir="ltr"
          >
            {blocked > 99 ? '99+' : blocked}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0" onMouseDown={() => setOpen(false)} />
          <div className="absolute end-0 top-10 z-50 w-72 rounded-card border border-line bg-surface p-4 shadow-hover">
            <h2 className="mb-1 font-semibold">{t('adblock.title')}</h2>
            {status === 'loading' && <p className="mb-2 text-muted">{t('adblock.loading')}</p>}
            {status === 'failed' && <p className="mb-2 text-[#d4482a]">{t('adblock.failed')}</p>}
            {web && (
              <>
                <p className="truncate text-muted" dir="ltr">
                  {host}
                </p>
                <p className="mb-1 mt-1">
                  {t('adblock.blockedHere')}{' '}
                  <span className="font-label font-semibold" dir="ltr">
                    {blocked}
                  </span>
                </p>
                <Switch
                  label={t('adblock.thisSite')}
                  checked={!siteAllowed}
                  onChange={toggleSite}
                />
              </>
            )}
            <div className="mt-1 border-t border-line pt-1">
              <Switch
                label={t('adblock.enabled')}
                checked={settings.adblockEnabled}
                onChange={(v) => void update({ adblockEnabled: v })}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
