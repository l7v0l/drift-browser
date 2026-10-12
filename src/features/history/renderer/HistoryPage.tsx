import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@renderer/components/Icon'
import { btn, field, PageShell } from '@renderer/pages/PageShell'
import type { ClearRange, HistoryEntry } from '@shared/types'

const call = window.drift.invoke
const SEARCH_DELAY_MS = 150
const RANGES: ClearRange[] = ['hour', 'day', 'week', 'all']

function groupByDay(entries: HistoryEntry[], locale: string): [string, HistoryEntry[]][] {
  const groups = new Map<string, HistoryEntry[]>()
  for (const e of entries) {
    const day = new Date(e.visitedAt).toLocaleDateString(locale, { dateStyle: 'full' })
    groups.set(day, [...(groups.get(day) ?? []), e])
  }
  return [...groups]
}

export default function HistoryPage() {
  const { t, i18n } = useTranslation()
  const [query, setQuery] = useState('')
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [range, setRange] = useState<ClearRange>('day')

  const refresh = useCallback(() => call('history:list', query).then(setEntries), [query])

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), SEARCH_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [refresh])

  const clear = async () => {
    await call('history:clear', range)
    await refresh()
  }

  return (
    <PageShell
      title={t('history.title')}
      actions={
        <>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as ClearRange)}
            aria-label={t('history.range')}
            className={`${btn} border border-line`}
          >
            {RANGES.map((r) => (
              <option key={r} value={r}>
                {t(`history.range_${r}`)}
              </option>
            ))}
          </select>
          <button onClick={() => void clear()} className={btn}>
            {t('history.clear')}
          </button>
        </>
      }
    >
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('history.search')}
        className={`${field} mb-6 w-full`}
      />
      {entries.length === 0 && <p className="text-muted">{t('history.empty')}</p>}
      {groupByDay(entries, i18n.language).map(([day, items]) => (
        <section key={day} className="mb-6">
          <h2 className="mb-2 font-semibold text-muted">{day}</h2>
          <ul className="flex flex-col overflow-hidden rounded-card bg-surface">
            {items.map((e) => (
              <li
                key={e.visitedAt}
                className="group flex items-center gap-3 px-4 py-2 transition-colors duration-150 hover:bg-surface-3"
              >
                <span className="w-12 shrink-0 text-muted">
                  {new Date(e.visitedAt).toLocaleTimeString(i18n.language, {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <button
                  onClick={() => void call('tabs:navigate', e.url)}
                  className="flex min-w-0 flex-1 items-baseline gap-3 text-start"
                >
                  <span className="truncate">{e.title || e.url}</span>
                  <span dir="ltr" className="truncate text-muted">
                    {e.url}
                  </span>
                </button>
                <button
                  aria-label={t('common.delete')}
                  title={t('common.delete')}
                  onClick={() => void call('history:remove', e.visitedAt).then(refresh)}
                  className="rounded-full p-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                >
                  <Icon name="close" size={14} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </PageShell>
  )
}
