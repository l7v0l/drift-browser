import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Favicon } from '@renderer/components/Favicon'
import { Icon } from '@renderer/components/Icon'
import { useOverlay } from '@renderer/hooks/useOverlay'
import { isNewTabUrl } from '@shared/url'
import type { TabInfo } from '@shared/types'
import { useTabs } from './store'

const call = window.drift.invoke

interface MenuState {
  tab: TabInfo
  x: number
  y: number
}

export function TabStrip({ leading }: { leading?: ReactNode }) {
  const { t } = useTranslation()
  const tabs = useTabs((s) => s.tabs)
  const activeId = useTabs((s) => s.activeId)
  const split = useTabs((s) => s.split)
  const [menu, setMenu] = useState<MenuState | null>(null)
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
                active
                  ? 'bg-surface shadow-rest'
                  : split?.includes(tab.id)
                    ? 'bg-surface-3 ring-1 ring-line'
                    : 'hover:bg-surface-3',
                overId === tab.id && dragId !== tab.id ? 'ring-2 ring-accent' : ''
              ].join(' ')}
            >
              {tab.loading ? (
                <Icon name="reload" size={16} className="shrink-0 animate-spin text-accent" />
              ) : (
                <Favicon src={tab.favicon} url={tab.url} />
              )}
              {!tab.pinned && (
                <>
                  <span className={`min-w-0 flex-1 truncate ${tab.discarded ? 'opacity-60' : ''}`}>
                    {title}
                  </span>
                  {(tab.audible || tab.muted) && (
                    <button
                      aria-label={tab.muted ? t('tab.unmute') : t('tab.mute')}
                      title={tab.muted ? t('tab.unmute') : t('tab.mute')}
                      onClick={(e) => {
                        e.stopPropagation()
                        void call('tabs:mute', tab.id, !tab.muted)
                      }}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-line"
                    >
                      <Icon name={tab.muted ? 'volume-off' : 'volume'} size={14} />
                    </button>
                  )}
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
            className="fixed z-50 min-w-52 rounded-xl border border-line bg-surface p-1 shadow-hover"
            style={{ top: menu.y, insetInlineStart: menu.x }}
          >
            {!menu.tab.discarded && (
              <MenuItem
                label={t('tab.reload')}
                onClick={() => run(() => void call('tabs:reload-tab', menu.tab.id))}
              />
            )}
            <MenuItem
              label={t('tab.duplicate')}
              onClick={() => run(() => void call('tabs:duplicate', menu.tab.id))}
            />
            <MenuItem
              label={menu.tab.pinned ? t('tab.unpin') : t('tab.pin')}
              onClick={() => run(() => void call('tabs:pin', menu.tab.id, !menu.tab.pinned))}
            />
            {!menu.tab.discarded && (
              <MenuItem
                label={menu.tab.muted ? t('tab.unmuteSite') : t('tab.muteSite')}
                onClick={() => run(() => void call('tabs:mute', menu.tab.id, !menu.tab.muted))}
              />
            )}
            <li className="my-1 h-px bg-line" aria-hidden="true" />
            <MenuItem
              label={t('tab.close')}
              onClick={() => run(() => void call('tabs:close', menu.tab.id))}
            />
            <MenuItem
              label={t('tab.closeOthers')}
              onClick={() => run(() => void call('tabs:close-others', menu.tab.id))}
            />
            <MenuItem
              label={t('tab.closeRight')}
              onClick={() => run(() => void call('tabs:close-right', menu.tab.id))}
            />
            <li className="my-1 h-px bg-line" aria-hidden="true" />
            <MenuItem
              label={t('tab.reopen')}
              onClick={() => run(() => void call('tabs:reopen-closed'))}
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
