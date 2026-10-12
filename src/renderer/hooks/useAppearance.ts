import { useEffect } from 'react'
import type { ThemeMode } from '@shared/types'
import { applyLanguage } from '../i18n'
import { useSettings } from '../store'

function applyTheme(mode: ThemeMode): void {
  const dark =
    mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

/** Keeps settings in sync with main and applies language, direction and theme to the document. */
export function useAppearance(): void {
  const { settings, load } = useSettings()

  useEffect(() => {
    void load()
    return window.drift.on('settings:changed', (s) => useSettings.setState({ settings: s }))
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
}
