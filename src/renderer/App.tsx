import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { applyLanguage } from './i18n'
import { useSettings } from './store'

export function App() {
  const { t } = useTranslation()
  const { settings, load } = useSettings()

  useEffect(() => {
    void load()
    return window.drift.on('settings:changed', (s) => useSettings.setState({ settings: s }))
  }, [load])

  useEffect(() => applyLanguage(settings.language), [settings.language])

  return (
    <main className="flex h-full flex-col items-center justify-center gap-2">
      <h1 className="text-4xl font-semibold">Drift</h1>
      <p>{t('app.tagline')}</p>
    </main>
  )
}
