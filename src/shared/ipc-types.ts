import type {
  Account,
  AccountProvider,
  ExtensionSummary,
  PasswordPrompt,
  PasswordSummary,
  AppInfo,
  Bookmark,
  ClearRange,
  DownloadInfo,
  FindResult,
  HistoryEntry,
  MemoryInfo,
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
  'app:info': Req<[], AppInfo>
  'app:memory': Req<[], MemoryInfo>
  'window:info': Req<[], WindowInfo>
  'account:get': Req<[], Account | null>
  'account:sign-in': Req<[provider: AccountProvider], Account>
  'account:confirm': Req<[save: boolean], Account | null>
  'account:use-email': Req<[provider: AccountProvider, email: string], Account>
  'account:cancel': Req
  'account:sign-out': Req
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
  'tabs:discard': Req<[id: number]>
  'tabs:split-toggle': Req
  'adblock:status': Req<[], 'loading' | 'ready' | 'failed'>
  'extensions:list': Req<[], ExtensionSummary[]>
  'extensions:install': Req<[input: string], ExtensionSummary[]>
  'extensions:remove': Req<[id: string], ExtensionSummary[]>
  'extensions:open': Req<[id: string]>
  'passwords:list': Req<[], PasswordSummary[]>
  'passwords:reveal': Req<[id: string], string>
  'passwords:remove': Req<[id: string], PasswordSummary[]>
  'passwords:resolve': Req<[action: 'save' | 'never' | 'dismiss']>
  'passwords:never-list': Req<[], string[]>
  'passwords:never-remove': Req<[origin: string], string[]>
  'passwords:available': Req<[], boolean>
  'app:install-update': Req
  'tabs:print': Req
  'tabs:devtools': Req
  'window:fullscreen': Req
  'app:quit': Req
  'tabs:mute': Req<[id: number, muted: boolean]>
  'tabs:duplicate': Req<[id: number]>
  'tabs:close-others': Req<[id: number]>
  'tabs:close-right': Req<[id: number]>
  'tabs:reload-tab': Req<[id: number]>
  'tabs:zoom': Req<[action: 'in' | 'out' | 'reset']>
  'find:start': Req<[text: string, forward: boolean, next: boolean]>
  'find:stop': Req
  'suggest:query': Req<[text: string], Suggestion[]>
  'ui:set-overlay': Req<[open: boolean]>
  'ui:set-chrome-height': Req<[height: number]>
  'bookmarks:list': Req<[], Bookmark[]>
  'bookmarks:toggle': Req<[url: string, title: string, favicon: string | null], Bookmark[]>
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
  'ui:open-find': null
  'find:result': FindResult
  'bookmarks:changed': Bookmark[]
  'account:changed': Account | null
  'extensions:changed': ExtensionSummary[]
  'passwords:prompt': PasswordPrompt | null
  'update:ready': { version: string }
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
  'app:memory': true,
  'window:info': true,
  'account:get': true,
  'account:sign-in': true,
  'account:confirm': true,
  'account:use-email': true,
  'account:cancel': true,
  'account:sign-out': true,
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
  'tabs:discard': true,
  'tabs:split-toggle': true,
  'adblock:status': true,
  'extensions:list': true,
  'extensions:install': true,
  'extensions:remove': true,
  'extensions:open': true,
  'passwords:list': true,
  'passwords:reveal': true,
  'passwords:remove': true,
  'passwords:resolve': true,
  'passwords:never-list': true,
  'passwords:never-remove': true,
  'passwords:available': true,
  'app:install-update': true,
  'tabs:print': true,
  'tabs:devtools': true,
  'window:fullscreen': true,
  'app:quit': true,
  'tabs:mute': true,
  'tabs:duplicate': true,
  'tabs:close-others': true,
  'tabs:close-right': true,
  'tabs:reload-tab': true,
  'tabs:zoom': true,
  'find:start': true,
  'find:stop': true,
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
  'ui:open-find': true,
  'find:result': true,
  'bookmarks:changed': true,
  'account:changed': true,
  'extensions:changed': true,
  'passwords:prompt': true,
  'update:ready': true,
  'downloads:changed': true
}

export const INVOKE_CHANNELS = Object.keys(invokeAllow) as InvokeChannel[]
export const EVENT_CHANNELS = Object.keys(eventAllow) as EventChannel[]

/** The subset a drift:// internal page may call. Everything else is chrome-UI only. */
export const PAGE_INVOKE_CHANNELS: ReadonlySet<InvokeChannel> = new Set<InvokeChannel>([
  'settings:get',
  'settings:set',
  'app:info',
  'app:memory',
  'tabs:discard',
  'window:info',
  'account:get',
  'account:sign-out',
  'adblock:status',
  'extensions:list',
  'extensions:install',
  'extensions:remove',
  'extensions:open',
  'passwords:list',
  'passwords:reveal',
  'passwords:remove',
  'passwords:never-list',
  'passwords:never-remove',
  'passwords:available',
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
