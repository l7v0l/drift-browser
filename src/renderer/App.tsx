import { useEffect, useState } from 'react'
import { AddressBar } from '@features/addressbar/renderer/AddressBar'
import { BookmarksBar } from '@features/bookmarks/renderer/BookmarksBar'
import { startBookmarksSync } from '@features/bookmarks/renderer/store'
import { DownloadsButton } from '@features/downloads/renderer/DownloadsButton'
import { startDownloadsSync } from '@features/downloads/renderer/store'
import { MainMenu } from '@features/menu/renderer/MainMenu'
import { TabStrip } from '@features/tabs/renderer/TabStrip'
import { startTabsSync } from '@features/tabs/renderer/store'
import { BOOKMARKS_BAR_HEIGHT, CHROME_HEIGHT } from '@shared/constants'
import { useTranslation } from 'react-i18next'
import { useAppearance } from './hooks/useAppearance'
import { useSettings } from './store'

export function App() {
  const { t } = useTranslation()
  const showBar = useSettings((s) => s.settings.showBookmarksBar)
  const [isPrivate, setPrivate] = useState(false)
  useAppearance()

  useEffect(() => {
    void window.drift.invoke('window:info').then((i) => setPrivate(i.private))
    const stops = [startTabsSync(), startBookmarksSync(), startDownloadsSync()]
    return () => stops.forEach((stop) => stop())
  }, [])

  // The page views start below the chrome, so main must know its current height.
  useEffect(() => {
    void window.drift.invoke(
      'ui:set-chrome-height',
      CHROME_HEIGHT + (showBar ? BOOKMARKS_BAR_HEIGHT : 0)
    )
  }, [showBar])

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
    </header>
  )
}
