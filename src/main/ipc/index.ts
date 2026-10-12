import { app, ipcMain, type BrowserWindow } from 'electron'
import type { IpcInvokeMap, InvokeChannel, EventChannel, IpcEventMap } from '@shared/ipc-types'
import { getSettings, patchSettings } from '../store'

type Handlers = {
  [C in InvokeChannel]: (...args: IpcInvokeMap[C]['args']) => IpcInvokeMap[C]['result']
}

export function send<C extends EventChannel>(
  win: BrowserWindow,
  channel: C,
  payload: IpcEventMap[C]
): void {
  if (!win.isDestroyed()) win.webContents.send(channel, payload)
}

export function registerIpc(getWindow: () => BrowserWindow | null): void {
  const handlers: Handlers = {
    'settings:get': () => getSettings(),
    'settings:set': (patch) => {
      const next = patchSettings(patch)
      const win = getWindow()
      if (win) send(win, 'settings:changed', next)
      return next
    },
    'app:info': () => ({ name: app.getName(), version: app.getVersion() })
  }
  for (const channel of Object.keys(handlers) as InvokeChannel[]) {
    const handler = handlers[channel] as (...a: unknown[]) => unknown
    ipcMain.handle(channel, (_e, ...args) => handler(...args))
  }
}
