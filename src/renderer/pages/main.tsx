import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import '../i18n'
import '../styles/index.css'
import './pages.css'
import { useAppearance } from '../hooks/useAppearance'

// One chunk per page: a drift:// tab only downloads the page it shows.
const pages = {
  newtab: lazy(() => import('@features/newtab/renderer/NewTab')),
  settings: lazy(() => import('@features/settings/renderer/SettingsPage')),
  history: lazy(() => import('@features/history/renderer/HistoryPage')),
  bookmarks: lazy(() => import('@features/bookmarks/renderer/BookmarksPage')),
  downloads: lazy(() => import('@features/downloads/renderer/DownloadsPage'))
}

function Pages() {
  useAppearance()
  const Page = pages[location.hostname as keyof typeof pages]
  return Page ? (
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  ) : null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Pages />
  </StrictMode>
)
