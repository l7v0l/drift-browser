import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Favicon } from '@renderer/components/Favicon'
import { Icon } from '@renderer/components/Icon'
import { PageShell, field } from '@renderer/pages/PageShell'
import type { Bookmark } from '@shared/types'
import { startBookmarksSync, useBookmarks } from './store'

const call = window.drift.invoke

function Row({ item }: { item: Bookmark }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState(item.title)
  const [url, setUrl] = useState(item.url)
  const dirty = title !== item.title || url !== item.url

  const save = () => {
    if (dirty && title.trim() && /^https?:\/\//i.test(url)) {
      void call('bookmarks:update', item.id, { title: title.trim(), url })
    }
  }

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-surface p-3">
      <Favicon src={item.favicon} size={20} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          aria-label={t('bookmarks.title')}
          className={`${field} py-1`}
        />
        <input
          value={url}
          dir="ltr"
          onChange={(e) => setUrl(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          aria-label="URL"
          className={`${field} py-1 text-muted`}
        />
      </div>
      <button
        onClick={() => void call('tabs:navigate', item.url)}
        className="rounded-full px-3 py-1 transition-colors duration-150 hover:bg-surface-3"
      >
        {t('common.open')}
      </button>
      <button
        aria-label={t('common.delete')}
        title={t('common.delete')}
        onClick={() => void call('bookmarks:remove', item.id)}
        className="rounded-full p-2 transition-colors duration-150 hover:bg-surface-3"
      >
        <Icon name="trash" size={16} />
      </button>
    </li>
  )
}

export default function BookmarksPage() {
  const { t } = useTranslation()
  const items = useBookmarks((s) => s.items)
  useEffect(() => startBookmarksSync(), [])

  return (
    <PageShell title={t('bookmarks.title')}>
      {items.length === 0 ? (
        <p className="text-muted">{t('bookmarks.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((b) => (
            <Row key={`${b.id}:${b.title}:${b.url}`} item={b} />
          ))}
        </ul>
      )}
    </PageShell>
  )
}
