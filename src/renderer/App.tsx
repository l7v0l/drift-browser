import { useEffect } from 'react'
import { AddressBar } from '@features/addressbar/renderer/AddressBar'
import { TabStrip } from '@features/tabs/renderer/TabStrip'
import { startTabsSync } from '@features/tabs/renderer/store'
import { applyLanguage } from './i18n'
import { useSettings } from './store'

function applyTheme(mode: 'light' | 'dark' | 'system'): void {
  const dark =
    mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

export function App() {
  const { settings, load } = useSettings()

  useEffect(() => {
    void load()
    const offSettings = window.drift.on('settings:changed', (s) =>
      useSettings.setState({ settings: s })
    )
    const offTabs = startTabsSync()
    return () => {
      offSettings()
      offTabs()
    }
  }, [load])

  useEffect(() => applyLanguage(settings.language), [settings.language])

  useEffect(() => {
    applyTheme(settings.theme)
    if (settings.theme !== 'system') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [settings.theme])

  return (
    <header className="border-b border-line">
      <TabStrip />
      <AddressBar />
    </header>
  )
}
