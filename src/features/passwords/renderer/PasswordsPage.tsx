import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@renderer/components/Icon'
import { btn, field, PageShell } from '@renderer/pages/PageShell'
import { useSettings } from '@renderer/store'
import type { PasswordSummary } from '@shared/types'

const call = window.drift.invoke

function Toggle(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl bg-surface px-4 py-3">
      <span>{props.label}</span>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        className="h-5 w-5 accent-[var(--accent)]"
      />
    </label>
  )
}

function Row({
  item,
  onRemoved
}: {
  item: PasswordSummary
  onRemoved: (list: PasswordSummary[]) => void
}) {
  const { t } = useTranslation()
  const [shown, setShown] = useState<string | null>(null)

  const toggle = async () =>
    setShown(shown === null ? await call('passwords:reveal', item.id) : null)
  const copy = async () => navigator.clipboard.writeText(await call('passwords:reveal', item.id))

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium" dir="ltr">
          {new URL(item.origin).host}
        </div>
        <div className="truncate text-muted" dir="ltr">
          {item.username || t('passwords.noUsername')}
        </div>
      </div>
      <span className="w-40 shrink-0 truncate font-label" dir="ltr">
        {shown ?? '••••••••••'}
      </span>
      <button
        aria-label={shown === null ? t('passwords.show') : t('passwords.hide')}
        title={shown === null ? t('passwords.show') : t('passwords.hide')}
        onClick={() => void toggle()}
        className="rounded-full p-2 transition-colors duration-150 hover:bg-surface-3"
      >
        <Icon name="eye" size={16} />
      </button>
      <button
        onClick={() => void copy()}
        className="rounded-full px-3 py-1 transition-colors duration-150 hover:bg-surface-3"
      >
        {t('passwords.copy')}
      </button>
      <button
        aria-label={t('common.delete')}
        title={t('common.delete')}
        onClick={() => void call('passwords:remove', item.id).then(onRemoved)}
        className="rounded-full p-2 transition-colors duration-150 hover:bg-surface-3"
      >
        <Icon name="trash" size={16} />
      </button>
    </li>
  )
}

export default function PasswordsPage() {
  const { t } = useTranslation()
  const { settings, update } = useSettings()
  const [items, setItems] = useState<PasswordSummary[]>([])
  const [never, setNever] = useState<string[]>([])
  const [available, setAvailable] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    void call('passwords:list').then(setItems)
    void call('passwords:never-list').then(setNever)
    void call('passwords:available').then(setAvailable)
  }, [])

  const q = query.trim().toLowerCase()
  const shown = q
    ? items.filter(
        (i) => i.origin.toLowerCase().includes(q) || i.username.toLowerCase().includes(q)
      )
    : items

  return (
    <PageShell title={t('passwords.title')}>
      <p className="mb-4 text-muted">{t('passwords.intro')}</p>
      {!available && (
        <p className="mb-4 rounded-2xl bg-amber/30 px-4 py-3">{t('passwords.unavailable')}</p>
      )}
      <div className="mb-6 flex flex-col gap-2">
        <Toggle
          label={t('passwords.offerSave')}
          checked={settings.savePasswords}
          onChange={(v) => void update({ savePasswords: v })}
        />
        <Toggle
          label={t('passwords.autofill')}
          checked={settings.autofillPasswords}
          onChange={(v) => void update({ autofillPasswords: v })}
        />
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('passwords.search')}
        className={`${field} mb-4 w-full`}
      />
      {shown.length === 0 ? (
        <p className="text-muted">{t('passwords.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((i) => (
            <Row key={i.id} item={i} onRemoved={setItems} />
          ))}
        </ul>
      )}

      {never.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 font-semibold">{t('passwords.neverTitle')}</h2>
          <ul className="flex flex-col gap-2">
            {never.map((origin) => (
              <li key={origin} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-2">
                <span className="min-w-0 flex-1 truncate" dir="ltr">
                  {new URL(origin).host}
                </span>
                <button
                  onClick={() => void call('passwords:never-remove', origin).then(setNever)}
                  className={btn}
                >
                  {t('common.delete')}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageShell>
  )
}
