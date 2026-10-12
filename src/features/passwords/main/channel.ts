import { ipcMain, type IpcMainEvent, type IpcMainInvokeEvent } from 'electron'
import { AppWindow } from '../../../main/window'
import { getSettings } from '../../../main/store'
import { decideCapture, isSecureOrigin, type Credentials } from './decide'
import {
  addNeverSave,
  credentialsFor,
  encryptionAvailable,
  existingFor,
  isNeverSaved,
  savePassword
} from './passwords'

interface Pending {
  origin: string
  username: string
  password: string
}

/** Login waiting for the user's Save / Never / Not now, per window. Plaintext lives only here. */
const pending = new WeakMap<AppWindow, Pending>()

const MAX_FIELD = 1024

/**
 * Web pages never get the Drift bridge, so the form script in the preload talks to main over
 * dedicated channels. Every call is re-checked: it must come from the top frame of a tab of a
 * normal (non-private) window, and the claimed origin must match the frame's real origin.
 */
function trusted(e: IpcMainEvent | IpcMainInvokeEvent, claimedOrigin: unknown): AppWindow | null {
  if (typeof claimedOrigin !== 'string' || !isSecureOrigin(claimedOrigin)) return null
  const frame = e.senderFrame
  if (!frame || frame !== e.sender.mainFrame) return null
  try {
    if (new URL(frame.url).origin !== claimedOrigin) return null
  } catch {
    return null
  }
  const win = AppWindow.fromSender(e.sender)
  return win && !win.isPrivate && win.tabs.owns(e.sender) ? win : null
}

export function registerPasswordChannels(): void {
  ipcMain.on('pm:capture', (e, payload: unknown) => {
    const p = payload as Partial<Pending> | null
    if (!p || typeof p.username !== 'string' || typeof p.password !== 'string') return
    if (p.username.length > MAX_FIELD || p.password.length > MAX_FIELD) return
    const win = trusted(e, p.origin)
    if (!win || !encryptionAvailable()) return
    const origin = p.origin as string

    const decision = decideCapture({
      enabled: getSettings().savePasswords,
      neverSaved: isNeverSaved(origin),
      username: p.username,
      password: p.password,
      existing: existingFor(origin, p.password)
    })
    if (decision === 'ignore') return
    pending.set(win, { origin, username: p.username, password: p.password })
    win.emit('passwords:prompt', { kind: decision, origin, username: p.username })
  })

  ipcMain.handle('pm:credentials', (e, origin: unknown): Credentials[] => {
    const win = trusted(e, origin)
    if (!win || !getSettings().autofillPasswords || !encryptionAvailable()) return []
    return credentialsFor(origin as string)
  })
}

export function resolvePrompt(win: AppWindow, action: 'save' | 'never' | 'dismiss'): void {
  const p = pending.get(win)
  pending.delete(win)
  if (p && action === 'save') savePassword(p.origin, p.username, p.password)
  if (p && action === 'never') addNeverSave(p.origin)
  win.emit('passwords:prompt', null)
}
