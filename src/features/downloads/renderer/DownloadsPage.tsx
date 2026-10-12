import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { btn, PageShell } from '@renderer/pages/PageShell'
import { DownloadRow } from './DownloadRow'
import { startDownloadsSync, useDownloads } from './store'

export default function DownloadsPage() {
  const { t } = useTranslation()
  const items = useDownloads((s) => s.items)
  useEffect(() => startDownloadsSync(), [])

  return (
    <PageShell
      title={t('downloads.title')}
      actions={
        <button onClick={() => void window.drift.invoke('downloads:clear')} className={btn}>
          {t('downloads.clear')}
        </button>
      }
    >
      {items.length === 0 ? (
        <p className="text-muted">{t('downloads.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((i) => (
            <DownloadRow key={i.id} item={i} />
          ))}
        </ul>
      )}
    </PageShell>
  )
}
