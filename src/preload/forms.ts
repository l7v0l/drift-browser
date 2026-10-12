import { ipcRenderer } from 'electron'
import {
  isSecureOrigin,
  pickCredentials,
  type Credentials,
  type FieldInfo
} from '@features/passwords/main/decide'

/**
 * Sign-in form support for ordinary web pages: notice when a login is submitted (so Drift can
 * offer to save it) and fill saved logins in. Runs in the preload's isolated world: page scripts
 * cannot see or call anything here, and synthetic events are ignored (`isTrusted`).
 */

const TEXT_TYPES = new Set(['text', 'email', 'tel', 'url', 'search', ''])
const DEDUPE_MS = 2000
const WATCH_MS = 20_000

const isVisible = (el: HTMLElement): boolean =>
  !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)

const loginInputs = (root: ParentNode): HTMLInputElement[] =>
  Array.from(root.querySelectorAll('input')).filter(
    (i) => i.type === 'password' || (TEXT_TYPES.has(i.type) && !i.disabled && !i.readOnly)
  )

/** The form around an element, or (for script-driven logins) the smallest ancestor with a username and a password. */
function containerOf(el: Element): ParentNode {
  const form = el.closest('form')
  if (form) return form
  let node: Element | null = el
  for (let depth = 0; depth < 6 && node; depth++, node = node.parentElement) {
    if (loginInputs(node).length >= 2) return node
  }
  return document
}

let lastSent = { key: '', at: 0 }

function capture(container: ParentNode): void {
  const inputs = loginInputs(container)
  const info: FieldInfo[] = inputs.map((i) => ({
    kind: i.type === 'password' ? 'password' : 'text',
    value: i.value,
    name: i.name || i.id,
    autocomplete: i.autocomplete,
    visible: isVisible(i)
  }))
  const creds = pickCredentials(info)
  if (!creds) return
  const key = `${creds.username}\u0000${creds.password}`
  if (key === lastSent.key && Date.now() - lastSent.at < DEDUPE_MS) return
  lastSent = { key, at: Date.now() }
  ipcRenderer.send('pm:capture', { origin: location.origin, ...creds })
}

function setValue(input: HTMLInputElement, value: string): void {
  // Frameworks track the value through the prototype setter; assigning .value alone is ignored.
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

const filled = new WeakSet<HTMLInputElement>()

async function autofill(): Promise<void> {
  const passwordFields = Array.from(
    document.querySelectorAll<HTMLInputElement>('input[type=password]')
  ).filter((i) => isVisible(i) && !i.value && !filled.has(i))
  if (passwordFields.length === 0) return

  const logins: Credentials[] = await ipcRenderer.invoke('pm:credentials', location.origin)
  if (logins.length === 0) return

  const field = passwordFields[0]
  const siblings = loginInputs(containerOf(field))
  const before = siblings.slice(0, siblings.indexOf(field))
  const userField = [...before].reverse().find((i) => i.type !== 'password' && isVisible(i))

  // Respect a username the user already typed; otherwise use the most recent login.
  const typed = userField?.value.trim()
  const login = typed ? logins.find((l) => l.username === typed) : logins[0]
  if (!login) return

  filled.add(field)
  if (userField && !typed) setValue(userField, login.username)
  setValue(field, login.password)
}

export function initFormScript(): void {
  if (!isSecureOrigin(location.origin)) return

  document.addEventListener(
    'submit',
    (e) => {
      if (e.isTrusted && e.target instanceof Element) capture(containerOf(e.target))
    },
    true
  )
  document.addEventListener(
    'click',
    (e) => {
      if (!e.isTrusted || !(e.target instanceof Element)) return
      const button = e.target.closest(
        'button, input[type=submit], input[type=button], [role=button]'
      )
      if (!button) return
      const container = containerOf(button)
      if (container.querySelector('input[type=password]')) capture(container)
    },
    true
  )
  document.addEventListener(
    'keydown',
    (e) => {
      const target = e.target
      if (e.isTrusted && e.key === 'Enter' && target instanceof HTMLInputElement) {
        capture(containerOf(target))
      }
    },
    true
  )

  // Login forms often appear after load (single-page apps), so keep looking for a short while.
  const run = (): void => void autofill().catch(() => undefined)
  let timer: number | undefined
  const watcher = new MutationObserver(() => {
    window.clearTimeout(timer)
    timer = window.setTimeout(run, 400)
  })
  const start = (): void => {
    run()
    watcher.observe(document.documentElement, { childList: true, subtree: true })
    window.setTimeout(() => watcher.disconnect(), WATCH_MS)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
  else start()
}
