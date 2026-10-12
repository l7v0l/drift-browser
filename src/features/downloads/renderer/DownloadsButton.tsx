import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@renderer/components/Icon'
import { useOverlay } from '@renderer/hooks/useOverlay'
import { DownloadRow } from './DownloadRow'
import { useDownloads } from './store'

const call = window.drift.invoke
const PANEL_LIMIT = 6

export function DownloadsButton() {
  const { t } = useTranslation()
  const items = useDownloads((s) => s.items)
  const [open, setOpen] = useState(false)
  useOverlay(open)

  const active = items.filter((i) => i.state === 'progressing').length

  return (
    <div className="relative">
      <button
        aria-label={t('downloads.title')}
        title={t('downloads.title')}
        onClick={() => setOpen(!open)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150 hover:bg-surface-3"
      >
        <Icon name="download" />
        {active > 0 && <span className="absolute end-1 top-1 h-2 w-2 rounded-full bg-accent" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0" onMouseDown={() => setOpen(false)} />
          <div className="absolute end-0 top-10 z-50 w-80 rounded-2xl border border-line bg-surface-2 p-2 shadow-hover">
            {items.length === 0 ? (
              <p className="p-3 text-muted">{t('downloads.empty')}</p>
            ) : (
              <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
                {items.slice(0, PANEL_LIMIT).map((i) => (
                  <DownloadRow key={i.id} item={i} />
                ))}
              </ul>
            )}
            <button
              onClick={() => {
                void call('tabs:create', 'drift://downloads')
                setOpen(false)
              }}
              className="mt-2 w-full rounded-full px-3 py-1.5 transition-colors duration-150 hover:bg-surface-3"
            >
              {t('downloads.showAll')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
