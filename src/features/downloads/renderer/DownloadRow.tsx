import { useTranslation } from 'react-i18next'
import type { DownloadInfo } from '@shared/types'

const call = window.drift.invoke

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`
}

export function DownloadRow({ item }: { item: DownloadInfo }) {
  const { t } = useTranslation()
  const running = item.state === 'progressing'
  const percent = item.total > 0 ? Math.round((item.received / item.total) * 100) : null

  return (
    <li className="flex flex-col gap-2 rounded-2xl bg-surface p-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 flex-1 truncate font-medium" dir="auto">
          {item.filename}
        </span>
        <span className="shrink-0 text-muted">
          {running
            ? `${formatBytes(item.received)}${item.total > 0 ? ` / ${formatBytes(item.total)}` : ''}`
            : t(`downloads.state_${item.state}`)}
        </span>
      </div>
      {running && (
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
          <div
            className={`h-full rounded-full bg-accent transition-[width] duration-200 ${
              percent === null ? 'w-1/3 animate-pulse' : ''
            }`}
            style={percent === null ? undefined : { width: `${percent}%` }}
          />
        </div>
      )}
      <div className="flex gap-2">
        {running ? (
          <button
            onClick={() => void call('downloads:cancel', item.id)}
            className="rounded-full px-3 py-1 transition-colors duration-150 hover:bg-surface-3"
          >
            {t('common.cancel')}
          </button>
        ) : (
          <>
            {item.state === 'completed' && (
              <button
                onClick={() => void call('downloads:open', item.id)}
                className="rounded-full px-3 py-1 transition-colors duration-150 hover:bg-surface-3"
              >
                {t('downloads.openFile')}
              </button>
            )}
            <button
              onClick={() => void call('downloads:show', item.id)}
              className="rounded-full px-3 py-1 transition-colors duration-150 hover:bg-surface-3"
            >
              {t('downloads.showFolder')}
            </button>
          </>
        )}
      </div>
    </li>
  )
}
