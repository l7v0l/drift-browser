import { app, ipcMain } from 'electron'
import type { IpcInvokeMap, InvokeChannel } from '@shared/ipc-types'
import { suggest } from '@features/addressbar/main/suggest'
import type { AppWindow } from '../window'
import { getSettings, patchSettings } from '../store'
import { send } from './send'

type Handlers = {
  [C in InvokeChannel]: (...args: IpcInvokeMap[C]['args']) => IpcInvokeMap[C]['result']
}

export function registerIpc(getWindow: () => AppWindow | null): void {
  const w = (): AppWindow => {
    const win = getWindow()
    if (!win) throw new Error('No window')
    return win
  }

  const handlers: Handlers = {
    'settings:get': () => getSettings(),
    'settings:set': (patch) => {
      const next = patchSettings(patch)
      send(w().ui.webContents, 'settings:changed', next)
      return next
    },
    'app:info': () => ({ name: app.getName(), version: app.getVersion() }),
    'tabs:state': () => w().tabs.snapshot(),
    'tabs:create': (url) => {
      w().tabs.create(url)
    },
    'tabs:close': (id) => w().tabs.close(id),
    'tabs:activate': (id) => w().tabs.activate(id),
    'tabs:move': (id, index) => w().tabs.move(id, index),
    'tabs:pin': (id, pinned) => w().tabs.pin(id, pinned),
    'tabs:navigate': (input) => w().tabs.navigate(String(input)),
    'tabs:back': () => w().tabs.back(),
    'tabs:forward': () => w().tabs.forward(),
    'tabs:reload': () => w().tabs.reload(),
    'tabs:stop': () => w().tabs.stop(),
    'tabs:home': () => w().tabs.home(),
    'tabs:reopen-closed': () => w().tabs.reopenClosed(),
    'suggest:query': (text) => suggest(String(text)),
    'ui:set-overlay': (open) => w().setOverlay(Boolean(open)),
    'ui:set-chrome-height': (height) => w().setChromeHeight(Number(height))
  }

  for (const channel of Object.keys(handlers) as InvokeChannel[]) {
    const handler = handlers[channel] as (...a: unknown[]) => unknown
    ipcMain.handle(channel, (_e, ...args) => handler(...args))
  }
}
