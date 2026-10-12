import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon, type IconName } from '@renderer/components/Icon'
import { useOverlay } from '@renderer/hooks/useOverlay'
import { useAccount } from '@features/account/renderer/store'
import { useFind } from '@features/find/renderer/store'
import { useActiveTab, useTabs } from '@features/tabs/renderer/store'

const call = window.drift.invoke

interface Row {
  icon: IconName
  label: string
  shortcut?: string
  onClick: () => void
}

function Separator() {
  return <li className="my-1 h-px bg-line" aria-hidden="true" />
}

function MenuRow({ row, onDone }: { row: Row; onDone: () => void }) {
  return (
    <li>
      <button
        onClick={() => {
          row.onClick()
          onDone()
        }}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-start transition-colors duration-150 hover:bg-surface-2"
      >
        <Icon name={row.icon} size={18} className="shrink-0 text-muted" />
        <span className="min-w-0 flex-1 truncate">{row.label}</span>
        {row.shortcut && (
          <span className="shrink-0 font-label text-xs text-muted" dir="ltr">
            {row.shortcut}
          </span>
        )}
      </button>
    </li>
  )
}

/** Main menu, laid out like a desktop browser: tabs and windows, account, library, tools, app. */
export function MainMenu() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const account = useAccount((s) => s.account)
  const setAccountUi = useAccount((s) => s.set)
  const tab = useActiveTab()
  const inSplit = useTabs((s) => s.split !== null)
  useOverlay(open)

  const close = () => setOpen(false)
  const page = (name: string) => () => void call('tabs:create', `drift://${name}`)

  const windowsAndTabs: Row[] = [
    {
      icon: 'plus',
      label: t('menu.newTab'),
      shortcut: 'Ctrl+T',
      onClick: () => void call('tabs:create')
    },
    {
      icon: 'window',
      label: t('menu.newWindow'),
      shortcut: 'Ctrl+N',
      onClick: () => void call('window:new', false)
    },
    {
      icon: 'eye',
      label: t('menu.privateWindow'),
      shortcut: 'Ctrl+Shift+N',
      onClick: () => void call('window:new', true)
    }
  ]
  const library: Row[] = [
    { icon: 'key', label: t('passwords.title'), onClick: page('passwords') },
    { icon: 'clock', label: t('history.title'), shortcut: 'Ctrl+H', onClick: page('history') },
    {
      icon: 'download',
      label: t('downloads.title'),
      shortcut: 'Ctrl+J',
      onClick: page('downloads')
    },
    {
      icon: 'star',
      label: t('bookmarks.title'),
      shortcut: 'Ctrl+Shift+O',
      onClick: page('bookmarks')
    },
    { icon: 'puzzle', label: t('extensions.title'), onClick: page('extensions') }
  ]
  const clearData: Row[] = [
    {
      icon: 'trash',
      label: t('menu.clearData'),
      shortcut: 'Ctrl+Shift+Del',
      onClick: page('history')
    }
  ]
  const tools: Row[] = [
    {
      icon: 'printer',
      label: t('menu.print'),
      shortcut: 'Ctrl+P',
      onClick: () => void call('tabs:print')
    },
    {
      icon: 'split',
      label: inSplit ? t('menu.splitClose') : t('menu.split'),
      onClick: () => void call('tabs:split-toggle')
    },
    {
      icon: 'search',
      label: t('menu.find'),
      shortcut: 'Ctrl+F',
      onClick: () => useFind.getState().setOpen(true)
    },
    {
      icon: 'code',
      label: t('menu.devtools'),
      shortcut: 'F12',
      onClick: () => void call('tabs:devtools')
    }
  ]
  const app: Row[] = [
    { icon: 'info', label: t('about.title'), onClick: page('about') },
    { icon: 'gear', label: t('settings.title'), onClick: page('settings') },
    { icon: 'power', label: t('menu.exit'), onClick: () => void call('app:quit') }
  ]

  const zoomPct = Math.round((tab?.zoom ?? 1) * 100)
  const iconBtn =
    'flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150 hover:bg-surface-3'

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
          <div className="fixed inset-0" onMouseDown={close} />
          <ul className="absolute end-0 top-10 z-50 max-h-[calc(100vh-110px)] w-[340px] overflow-y-auto rounded-card border border-line bg-surface p-2 shadow-hover">
            {windowsAndTabs.map((r) => (
              <MenuRow key={r.label} row={r} onDone={close} />
            ))}
            <Separator />

            <li>
              <button
                onClick={() => {
                  if (!account) setAccountUi({ phase: 'welcome', error: null })
                  close()
                }}
                className="my-1 flex w-full items-center gap-3 rounded-2xl bg-surface-2 px-3 py-1.5 text-start"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-ink">
                  {account ? (
                    account.name.slice(0, 1).toUpperCase()
                  ) : (
                    <Icon name="user" size={16} />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {account ? account.name : t('account.signIn')}
                </span>
                {account && (
                  <span className="shrink-0 rounded-full bg-amber/30 px-3 py-0.5 text-xs">
                    {t('menu.signedIn')}
                  </span>
                )}
              </button>
            </li>

            {library.map((r) => (
              <MenuRow key={r.label} row={r} onDone={close} />
            ))}
            <Separator />
            {clearData.map((r) => (
              <MenuRow key={r.label} row={r} onDone={close} />
            ))}
            <Separator />

            <li className="flex items-center gap-2 px-3 py-1">
              <span className="min-w-0 flex-1 truncate">{t('menu.zoom')}</span>
              <button
                aria-label={t('menu.fullscreen')}
                title="F11"
                className={iconBtn}
                onClick={() => {
                  void call('window:fullscreen')
                  close()
                }}
              >
                <Icon name="expand" size={16} />
              </button>
              <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
              <button
                aria-label="-"
                className={iconBtn}
                onClick={() => void call('tabs:zoom', 'out')}
              >
                <Icon name="minus" size={16} />
              </button>
              <button
                title={t('zoom.reset')}
                onClick={() => void call('tabs:zoom', 'reset')}
                className="w-12 rounded-full py-1 text-center font-label tabular-nums transition-colors duration-150 hover:bg-surface-3"
                dir="ltr"
              >
                {zoomPct}%
              </button>
              <button
                aria-label="+"
                className={iconBtn}
                onClick={() => void call('tabs:zoom', 'in')}
              >
                <Icon name="plus" size={16} />
              </button>
            </li>
            <Separator />

            {tools.map((r) => (
              <MenuRow key={r.label} row={r} onDone={close} />
            ))}
            <Separator />
            {app.map((r) => (
              <MenuRow key={r.label} row={r} onDone={close} />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
