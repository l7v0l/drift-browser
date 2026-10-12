import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageShell } from '@renderer/pages/PageShell'
import type { AppInfo, MemoryInfo } from '@shared/types'

const call = window.drift.invoke
const REFRESH_MS = 2000

export default function AboutPage() {
  const { t } = useTranslation()
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [memory, setMemory] = useState<MemoryInfo | null>(null)

  useEffect(() => {
    void call('app:info').then(setInfo)
    const refresh = () => void call('app:memory').then(setMemory)
    refresh()
    const timer = window.setInterval(refresh, REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [])

  const loaded = memory?.tabs.filter((tab) => !tab.discarded).length ?? 0

  return (
    <PageShell title={t('about.title')}>
      <section className="mb-6 rounded-2xl bg-surface p-4">
        <h2 className="text-xl font-semibold">{info?.name ?? 'Drift'}</h2>
        <p className="text-muted">{t('app.tagline')}</p>
        {info && (
          <dl dir="ltr" className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-start">
            <dt className="text-muted">Version</dt>
            <dd>{info.version}</dd>
            <dt className="text-muted">Electron</dt>
            <dd>{info.electron}</dd>
            <dt className="text-muted">Chromium</dt>
            <dd>{info.chrome}</dd>
            <dt className="text-muted">Node</dt>
            <dd>{info.node}</dd>
          </dl>
        )}
      </section>

      <section className="rounded-2xl bg-surface p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">{t('about.memory')}</h2>
          <span className="text-2xl font-semibold tabular-nums" dir="ltr">
            {memory ? `${memory.totalMB} MB` : '…'}
          </span>
        </div>
        {memory && (
          <p className="mb-3 text-muted">
            {t('about.tabsSummary', { loaded, discarded: memory.tabs.length - loaded })}
          </p>
        )}
        <ul className="flex flex-col">
          {memory?.tabs.map((tab) => (
            <li
              key={tab.id}
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors duration-150 hover:bg-surface-2"
            >
              <span className="min-w-0 flex-1 truncate" dir="auto" title={tab.url}>
                {tab.title || tab.url}
              </span>
              <span className="w-24 shrink-0 text-end text-muted tabular-nums" dir="ltr">
                {tab.discarded ? t('about.discarded') : `${tab.memoryMB ?? '–'} MB`}
              </span>
              <button
                disabled={tab.discarded}
                onClick={() => void call('tabs:discard', tab.id)}
                className="shrink-0 rounded-full px-3 py-1 transition-colors duration-150 hover:bg-surface-3 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                {t('about.discard')}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  )
}
