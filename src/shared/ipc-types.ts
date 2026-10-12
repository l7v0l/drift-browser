import type {
  Bookmark,
  ClearRange,
  DownloadInfo,
  HistoryEntry,
  Settings,
  ShortcutItem,
  Suggestion,
  TabsState,
  WindowInfo
} from './types'

type Req<A extends unknown[] = [], R = void> = { args: A; result: R }

/**
 * Single source of truth for IPC.
 * - `IpcInvokeMap`: renderer -> main request/response.
 * - `IpcEventMap`: main -> renderer push.
 * Add a channel here first; the compiler then forces the main handler and the preload allowlist.
 */
export interface IpcInvokeMap {
  'settings:get': Req<[], Settings>
  'settings:set': Req<[patch: Partial<Settings>], Settings>
  'app:info': Req<[], { name: string; version: string }>
  'window:info': Req<[], WindowInfo>
  'window:new': Req<[isPrivate: boolean]>
  'tabs:state': Req<[], TabsState>
  'tabs:create': Req<[url?: string]>
  'tabs:close': Req<[id: number]>
  'tabs:activate': Req<[id: number]>
  'tabs:move': Req<[id: number, index: number]>
  'tabs:pin': Req<[id: number, pinned: boolean]>
  'tabs:navigate': Req<[input: string]>
  'tabs:back': Req
  'tabs:forward': Req
  'tabs:reload': Req
  'tabs:stop': Req
  'tabs:home': Req
  'tabs:reopen-closed': Req
  'suggest:query': Req<[text: string], Suggestion[]>
  'ui:set-overlay': Req<[open: boolean]>
  'ui:set-chrome-height': Req<[height: number]>
  'bookmarks:list': Req<[], Bookmark[]>
  'bookmarks:toggle': Req<[url: string, title: string], Bookmark[]>
  'bookmarks:remove': Req<[id: string], Bookmark[]>
  'bookmarks:update': Req<[id: string, patch: { title?: string; url?: string }], Bookmark[]>
  'history:list': Req<[query?: string], HistoryEntry[]>
  'history:remove': Req<[visitedAt: number]>
  'history:clear': Req<[range: ClearRange]>
  'downloads:list': Req<[], DownloadInfo[]>
  'downloads:open': Req<[id: number]>
  'downloads:show': Req<[id: number]>
  'downloads:cancel': Req<[id: number]>
  'downloads:clear': Req
  'shortcuts:list': Req<[], ShortcutItem[]>
  'shortcuts:set': Req<[items: ShortcutItem[]], ShortcutItem[]>
}

export interface IpcEventMap {
  'settings:changed': Settings
  'tabs:changed': TabsState
  'ui:focus-address': null
  'bookmarks:changed': Bookmark[]
  'downloads:changed': DownloadInfo[]
}

export type InvokeChannel = keyof IpcInvokeMap
export type EventChannel = keyof IpcEventMap

export interface DriftApi {
  invoke<C extends InvokeChannel>(
    channel: C,
    ...args: IpcInvokeMap[C]['args']
  ): Promise<IpcInvokeMap[C]['result']>
  on<C extends EventChannel>(channel: C, listener: (payload: IpcEventMap[C]) => void): () => void
}

// Record<..., true> makes the compiler reject a channel missing from the allowlist.
const invokeAllow: Record<InvokeChannel, true> = {
  'settings:get': true,
  'settings:set': true,
  'app:info': true,
  'window:info': true,
  'window:new': true,
  'tabs:state': true,
  'tabs:create': true,
  'tabs:close': true,
  'tabs:activate': true,
  'tabs:move': true,
  'tabs:pin': true,
  'tabs:navigate': true,
  'tabs:back': true,
  'tabs:forward': true,
  'tabs:reload': true,
  'tabs:stop': true,
  'tabs:home': true,
  'tabs:reopen-closed': true,
  'suggest:query': true,
  'ui:set-overlay': true,
  'ui:set-chrome-height': true,
  'bookmarks:list': true,
  'bookmarks:toggle': true,
  'bookmarks:remove': true,
  'bookmarks:update': true,
  'history:list': true,
  'history:remove': true,
  'history:clear': true,
  'downloads:list': true,
  'downloads:open': true,
  'downloads:show': true,
  'downloads:cancel': true,
  'downloads:clear': true,
  'shortcuts:list': true,
  'shortcuts:set': true
}
const eventAllow: Record<EventChannel, true> = {
  'settings:changed': true,
  'tabs:changed': true,
  'ui:focus-address': true,
  'bookmarks:changed': true,
  'downloads:changed': true
}

export const INVOKE_CHANNELS = Object.keys(invokeAllow) as InvokeChannel[]
export const EVENT_CHANNELS = Object.keys(eventAllow) as EventChannel[]

/** The subset a drift:// internal page may call. Everything else is chrome-UI only. */
export const PAGE_INVOKE_CHANNELS: ReadonlySet<InvokeChannel> = new Set<InvokeChannel>([
  'settings:get',
  'settings:set',
  'app:info',
  'window:info',
  'tabs:navigate',
  'tabs:create',
  'bookmarks:list',
  'bookmarks:toggle',
  'bookmarks:remove',
  'bookmarks:update',
  'history:list',
  'history:remove',
  'history:clear',
  'downloads:list',
  'downloads:open',
  'downloads:show',
  'downloads:cancel',
  'downloads:clear',
  'shortcuts:list',
  'shortcuts:set'
])
