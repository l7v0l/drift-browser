import { promises as fs } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { app, ipcMain, webContents, type Session } from 'electron'
import { ElectronBlocker } from '@ghostery/adblocker-electron'
import type { Settings } from '@shared/types'
import { hostOf, isAllowlisted } from '@shared/allowlist'

export type AdBlockStatus = 'loading' | 'ready' | 'failed'

type Details = Electron.OnBeforeRequestListenerDetails
type Callback = (response: Electron.CallbackResponse) => void

const COUNT_NOTIFY_MS = 300
const COSMETIC_CHANNEL = '@ghostery/adblocker/inject-cosmetic-filters'
const MUTATION_CHANNEL = '@ghostery/adblocker/is-mutation-observer-enabled'

/**
 * Built-in ad and tracker blocker (Ghostery's engine, EasyList-compatible filters). The engine
 * is downloaded once and cached in the user data folder. Network blocking runs from Drift's own
 * webRequest handler (see main/requests.ts) so it can share the hook with other features, and
 * cosmetic filtering (hiding leftover ad boxes) is injected through a session preload.
 */
export class AdBlock {
  status: AdBlockStatus = 'loading'
  private blocker: ElectronBlocker | null = null
  private readonly counts = new Map<number, number>()
  private readonly timers = new Map<number, NodeJS.Timeout>()
  private readonly sessions = new Set<Session>()
  private readonly preloads = new WeakSet<Session>()

  constructor(
    private readonly getSettings: () => Settings,
    /** Called (throttled) when the blocked count of a page changes. */
    private readonly onCount: (webContentsId: number) => void
  ) {}

  async init(): Promise<void> {
    const cache = join(app.getPath('userData'), 'adblock-engine.bin')
    try {
      this.blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch, {
        path: cache,
        read: fs.readFile,
        write: fs.writeFile
      })
      this.status = 'ready'
      this.registerCosmetics()
    } catch (error) {
      this.status = 'failed'
      console.warn('[adblock] could not load filters:', (error as Error).message)
    }
  }

  /** Blocked requests on the current page of this webContents. */
  blockedFor(webContentsId: number): number {
    return this.counts.get(webContentsId) ?? 0
  }

  /** Inject cosmetic filters in this session (now, or as soon as the engine is ready). */
  attachSession(ses: Session): void {
    this.sessions.add(ses)
    this.addPreload(ses)
  }

  /** The webRequest.onBeforeRequest decision for one request. */
  filter(details: Details, callback: Callback): void {
    const settings = this.getSettings()
    const id = details.webContentsId
    if (id !== undefined && details.resourceType === 'mainFrame') this.counts.delete(id) // new page
    if (!this.blocker || !settings.adblockEnabled || this.siteAllowed(details, settings)) {
      callback({})
      return
    }
    this.blocker.onBeforeRequest(details, (response) => {
      if (id !== undefined && (response.cancel || response.redirectURL)) this.bump(id)
      callback(response)
    })
  }

  private siteAllowed(details: Details, settings: Settings): boolean {
    const page =
      details.resourceType === 'mainFrame'
        ? details.url
        : (details.webContentsId !== undefined &&
            webContents.fromId(details.webContentsId)?.getURL()) ||
          details.referrer
    return isAllowlisted(hostOf(page), settings.adblockAllowlist)
  }

  private bump(id: number): void {
    this.counts.set(id, (this.counts.get(id) ?? 0) + 1)
    if (this.timers.has(id)) return
    this.timers.set(
      id,
      setTimeout(() => {
        this.timers.delete(id)
        this.onCount(id)
      }, COUNT_NOTIFY_MS)
    )
  }

  private registerCosmetics(): void {
    const blocker = this.blocker
    if (!blocker) return
    ipcMain.handle(COSMETIC_CHANNEL, (event, url: string, msg?: unknown) => {
      const settings = this.getSettings()
      if (!/^https?:/i.test(url) || !settings.adblockEnabled) return
      if (isAllowlisted(hostOf(url), settings.adblockAllowlist)) return
      return blocker.onInjectCosmeticFilters(event, url, msg as never)
    })
    ipcMain.handle(MUTATION_CHANNEL, (event) => blocker.onIsMutationObserverEnabled(event))
    for (const ses of this.sessions) this.addPreload(ses)
  }

  private addPreload(ses: Session): void {
    if (!this.blocker || this.preloads.has(ses)) return
    this.preloads.add(ses)
    const path = createRequire(import.meta.url).resolve('@ghostery/adblocker-electron-preload')
    ses.registerPreloadScript({ type: 'frame', filePath: path })
  }
}
