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
import {
  installById,
  listExtensions,
  openExtensionPopup,
  removeById
} from '@features/extensions/main/extensions'
import { resolvePrompt } from '@features/passwords/main/channel'
import {
  encryptionAvailable,
  listPasswords,
  neverSaveList,
  removeNeverSave,
  removePassword,
  revealPassword
} from '@features/passwords/main/passwords'
import { accountService, adblock } from '../services'
import { AppWindow } from '../window'
import { getSettings, patchSettings } from '../store'
import { installUpdate } from '../updater'

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
    'account:use-email': (_w, provider, email) => accountService.useEmail(provider, String(email)),
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
    'tabs:split-toggle': (w) => w.tabs.toggleSplit(),
    'adblock:status': () => adblock.status,
    'extensions:list': () => listExtensions(),
    'extensions:install': async (_w, input) => extensionsChanged(await installById(String(input))),
    'extensions:remove': async (_w, id) => extensionsChanged(await removeById(String(id))),
    'extensions:open': (w, id) => {
      const kind = openExtensionPopup(w.win, String(id))
      if (kind === 'options') {
        const url = listExtensions().find((e) => e.id === String(id))?.optionsUrl
        if (url) w.tabs.create(url)
      }
    },
    'passwords:list': () => listPasswords(),
    'passwords:reveal': (_w, id) => revealPassword(String(id)),
    'passwords:remove': (_w, id) => removePassword(String(id)),
    'passwords:resolve': (w, action) => resolvePrompt(w, action),
    'passwords:never-list': () => neverSaveList(),
    'passwords:never-remove': (_w, origin) => removeNeverSave(String(origin)),
    'passwords:available': () => encryptionAvailable(),
    'app:install-update': () => installUpdate(),
    'tabs:print': (w) => w.tabs.print(),
    'tabs:devtools': (w) => w.tabs.toggleDevTools(),
    'window:fullscreen': (w) => w.win.setFullScreen(!w.win.isFullScreen()),
    'app:quit': () => app.quit(),
    'tabs:mute': (w, id, muted) => w.tabs.mute(Number(id), Boolean(muted)),
    'tabs:duplicate': (w, id) => w.tabs.duplicate(Number(id)),
    'tabs:close-others': (w, id) => w.tabs.closeOthers(Number(id)),
    'tabs:close-right': (w, id) => w.tabs.closeRight(Number(id)),
    'tabs:reload-tab': (w, id) => w.tabs.reloadTab(Number(id)),
    'tabs:zoom': (w, action) => w.tabs.zoom(action),
    'find:start': (w, text, forward, next) =>
      w.tabs.find(String(text), Boolean(forward), Boolean(next)),
    'find:stop': (w) => w.tabs.stopFind(),
    'suggest:query': (_w, text) => suggest(String(text)),
    'ui:set-overlay': (w, open) => w.setOverlay(Boolean(open)),
    'ui:set-chrome-height': (w, height) => w.setChromeHeight(Number(height)),
    'bookmarks:list': () => listBookmarks(),
    'bookmarks:toggle': (_w, url, title, favicon) =>
      bookmarksChanged(
        toggleBookmark(String(url), String(title), favicon ? String(favicon) : null)
      ),
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

function extensionsChanged<T extends ReturnType<typeof listExtensions>>(items: T): T {
  AppWindow.broadcast('extensions:changed', items)
  return items
}

function bookmarksChanged<T extends ReturnType<typeof listBookmarks>>(items: T): T {
  AppWindow.broadcast('bookmarks:changed', items)
  return items
}
