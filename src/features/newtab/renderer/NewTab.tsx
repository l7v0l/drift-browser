import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@renderer/components/Icon'
import { btn, field } from '@renderer/pages/PageShell'
import type { ShortcutItem } from '@shared/types'

const call = window.drift.invoke
const MAX_SHORTCUTS = 12

function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return now
}

function Clock() {
  const { i18n } = useTranslation()
  const now = useNow()
  const lang = i18n.language === 'ar' ? 'ar' : 'en'
  // Same locale base, different calendar: Gregorian and Umm al-Qura Hijri.
  const fmt = (calendar: string) =>
    now.toLocaleDateString(`${lang}-u-ca-${calendar}`, { dateStyle: 'full' })

  return (
    <div className="text-center">
      <div className="whitespace-nowrap text-7xl font-semibold tabular-nums">
        {now.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="mt-2 text-lg">{fmt('islamic-umalqura')}</div>
      <div className="text-muted">{fmt('gregory')}</div>
    </div>
  )
}

function Tiles() {
  const { t } = useTranslation()
  const [items, setItems] = useState<ShortcutItem[]>([])
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  useEffect(() => {
    void call('shortcuts:list').then(setItems)
  }, [])

  const save = (next: ShortcutItem[]) => void call('shortcuts:set', next).then(setItems)

  const add = () => {
    const full = /^https?:\/\//i.test(url) ? url : `https://${url}`
    if (!title.trim() || !url.trim()) return
    save([...items, { id: crypto.randomUUID(), title: title.trim(), url: full }])
    setTitle('')
    setUrl('')
  }

  return (
    <section className="w-full max-w-xl">
      <ul className="flex flex-wrap justify-center gap-4">
        {items.map((s) => (
          <li key={s.id} className="relative">
            <button
              onClick={() => void call('tabs:navigate', s.url)}
              className="flex w-24 flex-col items-center gap-2 rounded-2xl p-3 transition-colors duration-150 hover:bg-surface"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-semibold text-accent-ink">
                {s.title.slice(0, 1).toUpperCase()}
              </span>
              <span className="w-full truncate text-center">{s.title}</span>
            </button>
            {editing && (
              <button
                aria-label={t('common.delete')}
                onClick={() => save(items.filter((i) => i.id !== s.id))}
                className="absolute end-0 top-0 rounded-full bg-surface-3 p-1"
              >
                <Icon name="close" size={12} />
              </button>
            )}
          </li>
        ))}
      </ul>

      {editing && items.length < MAX_SHORTCUTS && (
        <form
          className="mt-4 flex flex-wrap justify-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('newtab.shortcutName')}
            className={`${field} w-40`}
          />
          <input
            value={url}
            dir="ltr"
            onChange={(e) => setUrl(e.target.value)}
            placeholder="example.com"
            className={`${field} w-48`}
          />
          <button type="submit" className={btn}>
            {t('common.add')}
          </button>
        </form>
      )}

      <div className="mt-4 text-center">
        <button onClick={() => setEditing(!editing)} className="text-muted underline">
          {editing ? t('common.done') : t('newtab.editShortcuts')}
        </button>
      </div>
    </section>
  )
}

export default function NewTab() {
  const { t } = useTranslation()
  const [text, setText] = useState('')

  useEffect(() => {
    document.title = t('tab.newTitle')
  }, [t])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-12">
      <Clock />
      <form
        className="w-full max-w-xl"
        onSubmit={(e) => {
          e.preventDefault()
          if (text.trim()) void call('tabs:navigate', text)
        }}
      >
        <div className="flex items-center gap-3 rounded-full border border-line bg-surface px-5 py-3 shadow-sm transition-shadow duration-150 focus-within:ring-2 focus-within:ring-accent">
          <Icon name="search" className="text-muted" />
          <input
            autoFocus
            value={text}
            dir="auto"
            onChange={(e) => setText(e.target.value)}
            placeholder={t('address.placeholder')}
            className="min-w-0 flex-1 bg-transparent text-lg outline-none"
          />
        </div>
      </form>
      <Tiles />
    </main>
  )
}
