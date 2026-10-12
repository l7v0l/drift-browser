import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@renderer/components/Icon'
import { btn, btnAccent, field, PageShell } from '@renderer/pages/PageShell'
import type { ExtensionSummary } from '@shared/types'

const call = window.drift.invoke
const STORE_URL = 'https://chromewebstore.google.com/'

export default function ExtensionsPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<ExtensionSummary[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void call('extensions:list').then(setItems)
    return window.drift.on('extensions:changed', setItems)
  }, [])

  const install = async () => {
    setBusy(true)
    setError(null)
    try {
      setItems(await call('extensions:install', input))
      setInput('')
    } catch (e) {
      const message = e instanceof Error ? e.message : ''
      setError(
        message.includes('invalid-extension-id') ? t('extensions.badId') : t('extensions.failed')
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell
      title={t('extensions.title')}
      actions={
        <button onClick={() => void call('tabs:create', STORE_URL)} className={btn}>
          {t('extensions.openStore')}
        </button>
      }
    >
      <p className="mb-4 text-muted">{t('extensions.intro')}</p>

      <form
        className="mb-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (input.trim()) void install()
        }}
      >
        <input
          value={input}
          dir="ltr"
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('extensions.placeholder')}
          className={`${field} min-w-0 flex-1`}
        />
        <button type="submit" disabled={busy} className={btnAccent}>
          {busy ? t('extensions.installing') : t('extensions.install')}
        </button>
      </form>
      {error && <p className="mb-4 text-[#d4482a]">{error}</p>}

      {items.length === 0 ? (
        <p className="text-muted">{t('extensions.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((ext) => (
            <li key={ext.id} className="flex items-center gap-3 rounded-2xl bg-surface p-4">
              {ext.icon ? (
                <img src={ext.icon} alt="" width={36} height={36} className="rounded-lg" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-3">
                  <Icon name="puzzle" size={20} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">
                  {ext.name}{' '}
                  <span className="font-label text-xs text-muted" dir="ltr">
                    {ext.version}
                  </span>
                </div>
                {ext.description && <div className="truncate text-muted">{ext.description}</div>}
              </div>
              {ext.optionsUrl && (
                <button
                  onClick={() => void call('tabs:create', ext.optionsUrl!)}
                  className="rounded-full px-3 py-1 transition-colors duration-150 hover:bg-surface-3"
                >
                  {t('extensions.options')}
                </button>
              )}
              <button
                aria-label={t('common.delete')}
                title={t('common.delete')}
                onClick={() => void call('extensions:remove', ext.id).then(setItems)}
                className="rounded-full p-2 transition-colors duration-150 hover:bg-surface-3"
              >
                <Icon name="trash" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  )
}
