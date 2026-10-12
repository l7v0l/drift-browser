import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@renderer/components/Icon'
import { FIND_BAR_HEIGHT } from '@shared/constants'
import { useFind } from './store'

const call = window.drift.invoke

export function FindBar() {
  const { t } = useTranslation()
  const { result, setOpen } = useFind()
  const inputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
    return window.drift.on('ui:open-find', () => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [])

  const close = () => {
    void call('find:stop')
    setOpen(false)
  }

  const step = (forward: boolean) => void call('find:start', text, forward, true)

  return (
    <div
      className="flex items-center justify-end gap-2 border-t border-line bg-surface px-3"
      style={{ height: FIND_BAR_HEIGHT }}
    >
      <input
        ref={inputRef}
        value={text}
        dir="auto"
        placeholder={t('find.placeholder')}
        onChange={(e) => {
          setText(e.target.value)
          void call('find:start', e.target.value, true, false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') step(!e.shiftKey)
          else if (e.key === 'Escape') close()
        }}
        className="h-8 w-64 rounded-full border border-line bg-surface-2 px-4 outline-none focus:ring-[3px] focus:ring-ring focus:border-accent"
        style={{ userSelect: 'text' }}
      />
      <span className="min-w-16 text-center text-muted font-label tabular-nums" dir="ltr">
        {text ? `${result.active}/${result.total}` : ''}
      </span>
      <button
        aria-label={t('find.prev')}
        title={t('find.prev')}
        onClick={() => step(false)}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150 hover:bg-surface-3"
      >
        <Icon name="back" className="rotate-90" />
      </button>
      <button
        aria-label={t('find.next')}
        title={t('find.next')}
        onClick={() => step(true)}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150 hover:bg-surface-3"
      >
        <Icon name="back" className="-rotate-90" />
      </button>
      <button
        aria-label={t('find.close')}
        title={t('find.close')}
        onClick={close}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150 hover:bg-surface-3"
      >
        <Icon name="close" />
      </button>
    </div>
  )
}
