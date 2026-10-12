import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@renderer/components/Icon'
import { useOverlay } from '@renderer/hooks/useOverlay'
import { isNewTabUrl } from '@shared/url'
import type { TabInfo } from '@shared/types'
import { useTabs } from './store'

const call = window.drift.invoke

function Favicon({ tab }: { tab: TabInfo }) {
  const [failed, setFailed] = useState(false)
  if (tab.favicon && !failed) {
    return (
      <img
        src={tab.favicon}
        alt=""
        className="h-4 w-4 shrink-0 rounded-sm"
        onError={() => setFailed(true)}
      />
    )
  }
  return <Icon name="globe" size={16} className="shrink-0 text-muted" />
}

export function TabStrip({ leading }: { leading?: ReactNode }) {
  const { t } = useTranslation()
  const tabs = useTabs((s) => s.tabs)
  const activeId = useTabs((s) => s.activeId)
  const [menu, setMenu] = useState<{ tab: TabInfo; x: number; y: number } | null>(null)
  const [overId, setOverId] = useState<number | null>(null)
  const [dragId, setDragId] = useState<number | null>(null)

  useOverlay(menu !== null)

  const run = (fn: () => void) => {
    fn()
    setMenu(null)
  }

  return (
    <div className="flex h-10 items-center gap-1 bg-surface-2 px-2">
      {leading}
      <div className="flex min-w-0 flex-1 items-center gap-1">
        {tabs.map((tab, index) => {
          const active = tab.id === activeId
          const title = tab.title || (isNewTabUrl(tab.url) ? t('tab.newTitle') : tab.url)
          return (
            <div
              key={tab.id}
              draggable
              title={title}
              onClick={() => void call('tabs:activate', tab.id)}
              onAuxClick={(e) => e.button === 1 && void call('tabs:close', tab.id)}
              onContextMenu={(e) => {
                e.preventDefault()
                setMenu({ tab, x: e.clientX, y: e.clientY })
              }}
              onDragStart={() => setDragId(tab.id)}
              onDragOver={(e) => {
                e.preventDefault()
                setOverId(tab.id)
              }}
              onDragLeave={() => setOverId(null)}
              onDragEnd={() => {
                setDragId(null)
                setOverId(null)
              }}
              onDrop={() => {
                if (dragId !== null && dragId !== tab.id) {
                  void call('tabs:move', dragId, index)
                }
                setDragId(null)
                setOverId(null)
              }}
              className={[
                'group flex h-8 items-center gap-2 rounded-full transition-colors duration-150',
                tab.pinned ? 'w-9 justify-center' : 'min-w-0 max-w-[200px] flex-1 px-3',
                active ? 'bg-surface shadow-sm' : 'hover:bg-surface-3',
                overId === tab.id && dragId !== tab.id ? 'ring-2 ring-accent' : ''
              ].join(' ')}
            >
              {tab.loading ? (
                <Icon name="reload" size={16} className="shrink-0 animate-spin text-accent" />
              ) : (
                <Favicon tab={tab} />
              )}
              {!tab.pinned && (
                <>
                  <span className={`min-w-0 flex-1 truncate ${tab.discarded ? 'opacity-60' : ''}`}>
                    {title}
                  </span>
                  <button
                    aria-label={t('tab.close')}
                    onClick={(e) => {
                      e.stopPropagation()
                      void call('tabs:close', tab.id)
                    }}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full opacity-0 transition-opacity duration-150 hover:bg-line group-hover:opacity-100"
                  >
                    <Icon name="close" size={12} />
                  </button>
                </>
              )}
            </div>
          )
        })}
        <button
          aria-label={t('tab.new')}
          title={t('tab.new')}
          onClick={() => void call('tabs:create')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-150 hover:bg-surface-3"
        >
          <Icon name="plus" size={16} />
        </button>
      </div>

      {menu && (
        <>
          <div
            className="fixed inset-0"
            onMouseDown={() => setMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault()
              setMenu(null)
            }}
          />
          <ul
            className="fixed z-50 min-w-40 rounded-xl border border-line bg-surface p-1 shadow-lg"
            style={{ top: menu.y, insetInlineStart: menu.x }}
          >
            <MenuItem
              label={menu.tab.pinned ? t('tab.unpin') : t('tab.pin')}
              onClick={() => run(() => void call('tabs:pin', menu.tab.id, !menu.tab.pinned))}
            />
            <MenuItem
              label={t('tab.reopen')}
              onClick={() => run(() => void call('tabs:reopen-closed'))}
            />
            <MenuItem
              label={t('tab.close')}
              onClick={() => run(() => void call('tabs:close', menu.tab.id))}
            />
          </ul>
        </>
      )}
    </div>
  )
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <li>
      <button
        onClick={onClick}
        className="w-full rounded-lg px-3 py-1.5 text-start transition-colors duration-150 hover:bg-surface-2"
      >
        {label}
      </button>
    </li>
  )
}
