import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@renderer/components/Icon'
import { useOverlay } from '@renderer/hooks/useOverlay'
import { useActiveTab } from '@features/tabs/renderer/store'
import { isNewTabUrl } from '@shared/url'
import { useBookmarks } from '@features/bookmarks/renderer/store'
import type { Suggestion } from '@shared/types'

const call = window.drift.invoke
const SUGGEST_DELAY_MS = 60

const displayUrl = (url: string): string => (isNewTabUrl(url) ? '' : url)

function NavButton(props: {
  icon: Parameters<typeof Icon>[0]['name']
  label: string
  disabled?: boolean
  flip?: boolean
  onClick: () => void
}) {
  return (
    <button
      aria-label={props.label}
      title={props.label}
      disabled={props.disabled}
      onClick={props.onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150 hover:bg-surface-3 disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <Icon name={props.icon} flip={props.flip} />
    </button>
  )
}

export function AddressBar({ trailing }: { trailing?: ReactNode }) {
  const { t } = useTranslation()
  const tab = useActiveTab()
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const [items, setItems] = useState<Suggestion[]>([])
  const [selected, setSelected] = useState(-1)

  const url = tab?.url ?? ''
  const bookmarked = useBookmarks((s) => s.items.some((b) => b.url === url))
  const canBookmark = url.startsWith('http://') || url.startsWith('https://')
  const open = focused && items.length > 0
  useOverlay(open)

  useEffect(
    () =>
      window.drift.on('ui:focus-address', () => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }),
    []
  )

  const close = () => {
    setItems([])
    setSelected(-1)
  }

  const go = (value: string) => {
    void call('tabs:navigate', value)
    close()
    inputRef.current?.blur()
  }

  const onChange = (value: string) => {
    setText(value)
    window.clearTimeout(timer.current)
    if (!value.trim()) return close()
    timer.current = window.setTimeout(() => {
      void call('suggest:query', value).then((list) => {
        setItems(list)
        setSelected(-1)
      })
    }, SUGGEST_DELAY_MS)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (items.length === 0) return
      e.preventDefault()
      // -1 means "the typed text"; wrap around through it.
      const next = selected + (e.key === 'ArrowDown' ? 1 : -1)
      setSelected(next < -1 ? items.length - 1 : next >= items.length ? -1 : next)
    } else if (e.key === 'Enter') {
      go(selected >= 0 && selected < items.length ? items[selected].url : text)
    } else if (e.key === 'Escape') {
      close()
      setText(displayUrl(url))
      inputRef.current?.blur()
    }
  }

  const secure = url.startsWith('https://')
  const insecure = url.startsWith('http://')

  return (
    <div className="flex h-12 items-center gap-1 bg-surface px-2">
      <NavButton
        icon="back"
        flip
        label={t('nav.back')}
        disabled={!tab?.canGoBack}
        onClick={() => void call('tabs:back')}
      />
      <NavButton
        icon="forward"
        flip
        label={t('nav.forward')}
        disabled={!tab?.canGoForward}
        onClick={() => void call('tabs:forward')}
      />
      <NavButton
        icon={tab?.loading ? 'stop' : 'reload'}
        label={tab?.loading ? t('nav.stop') : t('nav.reload')}
        onClick={() => void call(tab?.loading ? 'tabs:stop' : 'tabs:reload')}
      />
      <NavButton icon="home" label={t('nav.home')} onClick={() => void call('tabs:home')} />

      <div className="relative min-w-0 flex-1">
        <div
          className={`flex h-9 items-center gap-2 rounded-full bg-surface-2 px-3 transition-shadow duration-150 ${
            focused ? 'ring-2 ring-accent' : ''
          }`}
        >
          {secure && <Icon name="lock" size={15} className="shrink-0 text-accent" />}
          {insecure && <Icon name="warn" size={15} className="shrink-0 text-muted" />}
          {!secure && !insecure && <Icon name="search" size={15} className="shrink-0 text-muted" />}
          <input
            ref={inputRef}
            value={focused ? text : displayUrl(url)}
            dir="auto"
            spellCheck={false}
            placeholder={t('address.placeholder')}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              setFocused(true)
              setText(displayUrl(url))
              inputRef.current?.select()
            }}
            onBlur={() => {
              setFocused(false)
              close()
            }}
            onKeyDown={onKeyDown}
            className="min-w-0 flex-1 bg-transparent outline-none"
            style={{ userSelect: 'text' }}
          />
          {canBookmark && (
            <button
              aria-label={t('bookmarks.toggle')}
              title={t('bookmarks.toggle')}
              onClick={() => void call('bookmarks:toggle', url, tab?.title ?? '')}
              className={`shrink-0 transition-colors duration-150 ${
                bookmarked ? 'text-accent' : 'text-muted hover:text-ink'
              }`}
            >
              <Icon name="star" size={16} filled={bookmarked} />
            </button>
          )}
        </div>

        {open && (
          <>
            <div className="fixed inset-0" onMouseDown={() => inputRef.current?.blur()} />
            <ul className="absolute inset-x-0 top-11 z-50 overflow-hidden rounded-2xl border border-line bg-surface p-1 shadow-lg">
              {items.map((item, i) => (
                <li key={item.url}>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => go(item.url)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start transition-colors duration-150 ${
                      i === selected ? 'bg-surface-2' : 'hover:bg-surface-2'
                    }`}
                  >
                    <Icon name="search" size={14} className="shrink-0 text-muted" />
                    <span className="min-w-0 flex-1 truncate">{item.title || item.url}</span>
                    <span dir="ltr" className="max-w-[40%] truncate text-muted">
                      {item.url}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {trailing}
    </div>
  )
}
