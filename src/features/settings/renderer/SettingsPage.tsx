import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { field, PageShell } from '@renderer/pages/PageShell'
import { useSettings } from '@renderer/store'
import type { Lang, SearchEngine, ThemeMode } from '@shared/types'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl bg-surface px-4 py-3">
      <span>{label}</span>
      {children}
    </label>
  )
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const { settings, update } = useSettings()
  const [homepage, setHomepage] = useState<string | null>(null)

  const saveHomepage = () => {
    if (homepage !== null && homepage.trim()) void update({ homepage: homepage.trim() })
    setHomepage(null)
  }

  return (
    <PageShell title={t('settings.title')}>
      <div className="flex flex-col gap-2">
        <Row label={t('settings.language')}>
          <select
            value={settings.language}
            onChange={(e) => void update({ language: e.target.value as Lang })}
            className={field}
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </Row>
        <Row label={t('settings.theme')}>
          <select
            value={settings.theme}
            onChange={(e) => void update({ theme: e.target.value as ThemeMode })}
            className={field}
          >
            <option value="system">{t('settings.themeSystem')}</option>
            <option value="light">{t('settings.themeLight')}</option>
            <option value="dark">{t('settings.themeDark')}</option>
          </select>
        </Row>
        <Row label={t('settings.searchEngine')}>
          <select
            value={settings.searchEngine}
            onChange={(e) => void update({ searchEngine: e.target.value as SearchEngine })}
            className={field}
          >
            <option value="google">Google</option>
            <option value="bing">Bing</option>
            <option value="duckduckgo">DuckDuckGo</option>
          </select>
        </Row>
        <Row label={t('settings.homepage')}>
          <input
            dir="ltr"
            value={homepage ?? settings.homepage}
            onChange={(e) => setHomepage(e.target.value)}
            onBlur={saveHomepage}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className={`${field} w-64`}
          />
        </Row>
        <Row label={t('settings.discard')}>
          <select
            value={settings.discardAfterMinutes}
            onChange={(e) => void update({ discardAfterMinutes: Number(e.target.value) })}
            className={field}
          >
            <option value={0}>{t('settings.discardOff')}</option>
            {[10, 30, 60].map((m) => (
              <option key={m} value={m}>
                {t('settings.discardMinutes', { count: m })}
              </option>
            ))}
          </select>
        </Row>
        <Row label={t('adblock.enabled')}>
          <input
            type="checkbox"
            checked={settings.adblockEnabled}
            onChange={(e) => void update({ adblockEnabled: e.target.checked })}
            className="h-5 w-5 accent-[var(--accent)]"
          />
        </Row>
        <Row label={t('settings.bookmarksBar')}>
          <input
            type="checkbox"
            checked={settings.showBookmarksBar}
            onChange={(e) => void update({ showBookmarksBar: e.target.checked })}
            className="h-5 w-5 accent-[var(--accent)]"
          />
        </Row>
      </div>
    </PageShell>
  )
}
