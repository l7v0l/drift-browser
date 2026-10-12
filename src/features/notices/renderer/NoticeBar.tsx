import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@renderer/components/Icon'
import { NOTICE_BAR_HEIGHT } from '@shared/constants'
import { useNotices } from './store'

const call = window.drift.invoke

function Bar({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex items-center gap-3 border-t border-line bg-surface-3 px-4"
      style={{ height: NOTICE_BAR_HEIGHT }}
    >
      {children}
    </div>
  )
}

const primary =
  'rounded-full bg-coral px-4 py-1.5 text-white transition-opacity duration-150 hover:opacity-90'
const ghost = 'rounded-full px-4 py-1.5 transition-colors duration-150 hover:bg-surface-2'

/** Prompts that need an answer but should not block the page: save a password, restart to update. */
export function NoticeBar() {
  const { t } = useTranslation()
  const password = useNotices((s) => s.password)
  const update = useNotices((s) => s.update)
  const setUpdate = useNotices((s) => s.setUpdate)

  return (
    <>
      {password && (
        <Bar>
          <Icon name="key" className="shrink-0 text-accent" />
          <div className="min-w-0 flex-1 truncate">
            <span className="font-medium">
              {password.kind === 'update' ? t('passwords.updateQ') : t('passwords.saveQ')}
            </span>{' '}
            <span className="text-muted" dir="ltr">
              {new URL(password.origin).host}
              {password.username && ` · ${password.username}`}
            </span>
          </div>
          <button className={primary} onClick={() => void call('passwords:resolve', 'save')}>
            {password.kind === 'update' ? t('passwords.update') : t('common.save')}
          </button>
          <button className={ghost} onClick={() => void call('passwords:resolve', 'never')}>
            {t('passwords.never')}
          </button>
          <button className={ghost} onClick={() => void call('passwords:resolve', 'dismiss')}>
            {t('passwords.notNow')}
          </button>
        </Bar>
      )}
      {update && (
        <Bar>
          <Icon name="download" className="shrink-0 text-accent" />
          <div className="min-w-0 flex-1 truncate">{t('update.ready', { version: update })}</div>
          <button className={primary} onClick={() => void call('app:install-update')}>
            {t('update.restart')}
          </button>
          <button className={ghost} onClick={() => setUpdate(null)}>
            {t('update.later')}
          </button>
        </Bar>
      )}
    </>
  )
}
