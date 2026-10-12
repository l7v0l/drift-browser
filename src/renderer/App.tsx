import { useEffect, useState } from 'react'
import { AddressBar } from '@features/addressbar/renderer/AddressBar'
import { BookmarksBar } from '@features/bookmarks/renderer/BookmarksBar'
import { startBookmarksSync } from '@features/bookmarks/renderer/store'
import { DownloadsButton } from '@features/downloads/renderer/DownloadsButton'
import { startDownloadsSync } from '@features/downloads/renderer/store'
import { FindBar } from '@features/find/renderer/FindBar'
import { useFind } from '@features/find/renderer/store'
import { MainMenu } from '@features/menu/renderer/MainMenu'
import { TabStrip } from '@features/tabs/renderer/TabStrip'
import { startTabsSync, useTabs } from '@features/tabs/renderer/store'
import { BOOKMARKS_BAR_HEIGHT, CHROME_HEIGHT, FIND_BAR_HEIGHT } from '@shared/constants'
import { useTranslation } from 'react-i18next'
import { useAppearance } from './hooks/useAppearance'
import { useSettings } from './store'

export function App() {
  const { t } = useTranslation()
  const showBar = useSettings((s) => s.settings.showBookmarksBar)
  const [isPrivate, setPrivate] = useState(false)
  const findOpen = useFind((s) => s.open)
  const activeId = useTabs((s) => s.activeId)
  useAppearance()

  useEffect(() => {
    void window.drift.invoke('window:info').then((i) => setPrivate(i.private))
    const stops = [
      startTabsSync(),
      startBookmarksSync(),
      startDownloadsSync(),
      window.drift.on('find:result', (r) => useFind.getState().setResult(r)),
      window.drift.on('ui:open-find', () => useFind.getState().setOpen(true))
    ]
    return () => stops.forEach((stop) => stop())
  }, [])

  // The page views start below the chrome, so main must know its current height.
  useEffect(() => {
    const height =
      CHROME_HEIGHT + (showBar ? BOOKMARKS_BAR_HEIGHT : 0) + (findOpen ? FIND_BAR_HEIGHT : 0)
    void window.drift.invoke('ui:set-chrome-height', height)
  }, [showBar, findOpen])

  // Find results belong to one page; leaving the tab ends the search (main clears highlights).
  useEffect(() => useFind.getState().setOpen(false), [activeId])

  return (
    <header className="border-b border-line">
      <TabStrip
        leading={
          isPrivate ? (
            <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-accent-ink">
              {t('menu.private')}
            </span>
          ) : null
        }
      />
      <AddressBar
        trailing={
          <>
            <DownloadsButton />
            <MainMenu />
          </>
        }
      />
      {showBar && <BookmarksBar />}
      {findOpen && <FindBar />}
    </header>
  )
}
