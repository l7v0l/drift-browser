import { useTranslation } from 'react-i18next'
import { Favicon } from '@renderer/components/Favicon'
import { BOOKMARKS_BAR_HEIGHT } from '@shared/constants'
import { useBookmarks } from './store'

const call = window.drift.invoke

export function BookmarksBar() {
  const { t } = useTranslation()
  const items = useBookmarks((s) => s.items)

  return (
    <nav
      className="flex items-center gap-1 overflow-hidden bg-surface px-2"
      style={{ height: BOOKMARKS_BAR_HEIGHT }}
    >
      {items.length === 0 && <span className="px-2 text-muted">{t('bookmarks.barEmpty')}</span>}
      {items.map((b) => (
        <button
          key={b.id}
          title={b.url}
          onClick={() => void call('tabs:navigate', b.url)}
          onAuxClick={(e) => e.button === 1 && void call('tabs:create', b.url)}
          className="flex max-w-[180px] shrink-0 items-center gap-2 rounded-full px-3 py-1 transition-colors duration-150 hover:bg-surface-2"
        >
          <Favicon src={b.favicon} url={b.url} />
          <span className="truncate">{b.title}</span>
        </button>
      ))}
    </nav>
  )
}
