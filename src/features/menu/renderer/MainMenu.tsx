import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@renderer/components/Icon'
import { useOverlay } from '@renderer/hooks/useOverlay'

const call = window.drift.invoke

export function MainMenu() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  useOverlay(open)

  const run = (fn: () => void) => {
    fn()
    setOpen(false)
  }
  const page = (name: string) => () => void call('tabs:create', `drift://${name}`)

  const items: [string, () => void][] = [
    [t('menu.newWindow'), () => void call('window:new', false)],
    [t('menu.privateWindow'), () => void call('window:new', true)],
    [t('bookmarks.title'), page('bookmarks')],
    [t('history.title'), page('history')],
    [t('downloads.title'), page('downloads')],
    [t('settings.title'), page('settings')],
    [t('about.title'), page('about')]
  ]

  return (
    <div className="relative">
      <button
        aria-label={t('menu.title')}
        title={t('menu.title')}
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150 hover:bg-surface-3"
      >
        <Icon name="menu" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0" onMouseDown={() => setOpen(false)} />
          <ul className="absolute end-0 top-10 z-50 min-w-48 rounded-xl border border-line bg-surface p-1 shadow-hover">
            {items.map(([label, fn]) => (
              <li key={label}>
                <button
                  onClick={() => run(fn)}
                  className="w-full rounded-lg px-3 py-1.5 text-start transition-colors duration-150 hover:bg-surface-2"
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
