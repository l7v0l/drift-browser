import type { WebContents } from 'electron'

export type ShortcutId =
  | 'new-tab'
  | 'close-tab'
  | 'reopen-tab'
  | 'focus-address'
  | 'next-tab'
  | 'prev-tab'
  | 'reload'
  | 'fullscreen'
  | 'find'
  | 'zoom-in'
  | 'zoom-out'
  | 'zoom-reset'
  | 'new-window'
  | 'private-window'

export interface KeyInput {
  key: string
  control: boolean
  meta: boolean
  shift: boolean
  alt: boolean
}

export function matchShortcut(input: KeyInput): ShortcutId | null {
  const key = input.key.toLowerCase()
  const mod = input.control || input.meta
  if (key === 'f5') return 'reload'
  if (key === 'f11') return 'fullscreen'
  if (input.alt && key === 'd' && !mod) return 'focus-address'
  if (!mod || input.alt) return null
  if (key === 'tab') return input.shift ? 'prev-tab' : 'next-tab'
  if (key === 't') return input.shift ? 'reopen-tab' : 'new-tab'
  if (key === '+' || key === '=') return 'zoom-in'
  if (key === '-' || key === '_') return 'zoom-out'
  if (key === '0') return 'zoom-reset'
  if (key === 'n') return input.shift ? 'private-window' : 'new-window'
  if (input.shift) return null
  if (key === 'f') return 'find'
  if (key === 'w') return 'close-tab'
  if (key === 'l') return 'focus-address'
  if (key === 'r') return 'reload'
  return null
}

/** Shortcuts must work whether focus is in the chrome UI or inside a page. */
export function bindShortcuts(wc: WebContents, run: (id: ShortcutId) => void): void {
  wc.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    const id = matchShortcut(input)
    if (!id) return
    event.preventDefault()
    run(id)
  })
}
