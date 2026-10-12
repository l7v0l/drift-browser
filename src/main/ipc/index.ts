import { app, ipcMain, type IpcMainInvokeEvent } from 'electron'
import { DRIFT_SCHEME } from '@shared/constants'
import { PAGE_INVOKE_CHANNELS, type InvokeChannel, type IpcInvokeMap } from '@shared/ipc-types'
import { buildMemoryInfo } from '@features/about/main/memory'
import { suggest } from '@features/addressbar/main/suggest'
import {
  listBookmarks,
  removeBookmark,
  toggle as toggleBookmark,
  updateBookmark
} from '@features/bookmarks/main/bookmarks'
import { clearHistory, listHistory, removeEntry } from '@features/history/main/history'
import { listShortcuts, setShortcuts } from '@features/newtab/main/shortcuts'
import { accountService } from '../services'
import { AppWindow } from '../window'
import { getSettings, patchSettings } from '../store'

type Handlers = {
  [C in InvokeChannel]: (
    win: AppWindow,
    ...args: IpcInvokeMap[C]['args']
  ) => IpcInvokeMap[C]['result'] | Promise<IpcInvokeMap[C]['result']>
}

/**
 * Chrome UI may call everything. A drift:// page may call only PAGE_INVOKE_CHANNELS.
 * Web pages never reach here: their preload does not expose the bridge.
 */
function authorize(e: IpcMainInvokeEvent, channel: InvokeChannel): AppWindow {
  const win = AppWindow.fromSender(e.sender)
  if (!win) throw new Error('Unknown sender')
  if (e.sender === win.ui.webContents) return win
  const url = e.senderFrame?.url ?? ''
  if (url.startsWith(DRIFT_SCHEME + '//') && PAGE_INVOKE_CHANNELS.has(channel)) return win
  throw new Error(`Unauthorized: ${channel}`)
}

export function registerIpc(): void {
  const handlers: Handlers = {
    'settings:get': () => getSettings(),
    'settings:set': (_w, patch) => {
      const next = patchSettings(patch)
      AppWindow.broadcast('settings:changed', next)
      return next
    },
    'app:info': () => ({
      name: app.getName(),
      version: app.getVersion(),
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node
    }),
    'app:memory': (w) =>
      buildMemoryInfo(
        app.getAppMetrics().map((m) => ({ pid: m.pid, workingSetKB: m.memory.workingSetSize })),
        w.tabs.processIds()
      ),
    'window:info': (w) => ({ private: w.isPrivate, intro: w.intro }),
    'account:get': () => accountService.get(),
    'account:sign-in': (_w, provider) => accountService.signIn(provider),
    'account:confirm': (_w, save) => accountService.confirm(Boolean(save)),
    'account:cancel': () => accountService.cancel(),
    'account:sign-out': () => accountService.signOut(),
    'window:new': (_w, isPrivate) => {
      AppWindow.open(Boolean(isPrivate))
    },
    'tabs:state': (w) => w.tabs.snapshot(),
    'tabs:create': (w, url) => {
      w.tabs.create(url)
    },
    'tabs:close': (w, id) => w.tabs.close(id),
    'tabs:activate': (w, id) => w.tabs.activate(id),
    'tabs:move': (w, id, index) => w.tabs.move(id, index),
    'tabs:pin': (w, id, pinned) => w.tabs.pin(id, pinned),
    'tabs:navigate': (w, input) => w.tabs.navigate(String(input)),
    'tabs:back': (w) => w.tabs.back(),
    'tabs:forward': (w) => w.tabs.forward(),
    'tabs:reload': (w) => w.tabs.reload(),
    'tabs:stop': (w) => w.tabs.stop(),
    'tabs:home': (w) => w.tabs.home(),
    'tabs:reopen-closed': (w) => w.tabs.reopenClosed(),
    'tabs:discard': (w, id) => w.tabs.discard(Number(id)),
    'tabs:zoom': (w, action) => w.tabs.zoom(action),
    'find:start': (w, text, forward, next) =>
      w.tabs.find(String(text), Boolean(forward), Boolean(next)),
    'find:stop': (w) => w.tabs.stopFind(),
    'suggest:query': (_w, text) => suggest(String(text)),
    'ui:set-overlay': (w, open) => w.setOverlay(Boolean(open)),
    'ui:set-chrome-height': (w, height) => w.setChromeHeight(Number(height)),
    'bookmarks:list': () => listBookmarks(),
    'bookmarks:toggle': (_w, url, title) =>
      bookmarksChanged(toggleBookmark(String(url), String(title))),
    'bookmarks:remove': (_w, id) => bookmarksChanged(removeBookmark(String(id))),
    'bookmarks:update': (_w, id, patch) => bookmarksChanged(updateBookmark(String(id), patch)),
    'history:list': (_w, query) => listHistory(query === undefined ? undefined : String(query)),
    'history:remove': (_w, visitedAt) => removeEntry(Number(visitedAt)),
    'history:clear': (_w, range) => clearHistory(range),
    'downloads:list': (w) => w.downloads.list(),
    'downloads:open': (w, id) => w.downloads.open(Number(id)),
    'downloads:show': (w, id) => w.downloads.show(Number(id)),
    'downloads:cancel': (w, id) => w.downloads.cancel(Number(id)),
    'downloads:clear': (w) => w.downloads.clear(),
    'shortcuts:list': () => listShortcuts(),
    'shortcuts:set': (_w, items) => setShortcuts(Array.isArray(items) ? items : [])
  }

  for (const channel of Object.keys(handlers) as InvokeChannel[]) {
    const handler = handlers[channel] as (win: AppWindow, ...a: unknown[]) => unknown
    ipcMain.handle(channel, (e, ...args) => handler(authorize(e, channel), ...args))
  }
}

function bookmarksChanged<T extends ReturnType<typeof listBookmarks>>(items: T): T {
  AppWindow.broadcast('bookmarks:changed', items)
  return items
}
