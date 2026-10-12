import { WebContentsView, type BrowserWindow, type Rectangle, type WebContents } from 'electron'
import { resolveInput } from '@shared/url'
import { DRIFT_SCHEME, NEW_TAB_URL } from '@shared/constants'
import { isNewTabUrl } from '@shared/url'
import type { FindResult, SavedTab, SessionData, Settings, TabInfo, TabsState } from '@shared/types'
import { pickIdleTabs } from './discard'
import { nextZoom } from './zoom'

interface Tab extends SavedTab {
  id: number
  loading: boolean
  view: WebContentsView | null
  lastRecordedUrl: string
  lastActive: number
}

export interface TabManagerOptions {
  win: BrowserWindow
  /** Chrome UI view; kept above page views at all times. */
  ui: WebContentsView
  partition: string
  /** Preload that exposes the bridge only to drift:// pages. */
  preload: string
  getBounds: () => Rectangle
  getSettings: () => Settings
  onChange: (state: TabsState) => void
  /** Hook for per-page webContents setup (shortcuts). */
  bindInput: (wc: WebContents) => void
  onVisit?: (url: string, title: string) => void
  onFind: (result: FindResult) => void
  /** Ads and trackers blocked on the page shown by this webContents. */
  getBlocked: (webContentsId: number) => number
  /** A page reported its icon (used to fill in icons of existing bookmarks). */
  onFavicon?: (url: string, favicon: string) => void
  loadSession: () => SessionData
  saveSession: (session: SessionData) => void
}

const MAX_CLOSED = 25
const originOf = (url: string): string => {
  try {
    return new URL(url).origin
  } catch {
    return ''
  }
}
const SAVE_DELAY_MS = 500
const IDLE_CHECK_MS = 60_000

export class TabManager {
  private tabs: Tab[] = []
  private activeId: number | null = null
  private closed: SavedTab[] = []
  private seq = 0
  private emitQueued = false
  private saveTimer: NodeJS.Timeout | null = null

  private idleTimer: NodeJS.Timeout
  /** Split view: two tabs side by side. `a` is the primary pane. */
  private split: { a: number; b: number } | null = null
  /** Newest find request; results of older (superseded) requests are dropped. */
  private findRequest = 0

  constructor(private readonly opts: TabManagerOptions) {
    this.idleTimer = setInterval(() => this.discardIdle(), IDLE_CHECK_MS)
    this.idleTimer.unref()
  }

  dispose(): void {
    clearInterval(this.idleTimer)
    if (this.saveTimer) clearTimeout(this.saveTimer)
  }

  restore(): void {
    const session = this.opts.loadSession()
    if (session.tabs.length === 0) {
      this.create(this.opts.getSettings().homepage)
      return
    }
    for (const saved of session.tabs) this.add(saved)
    const active = this.tabs[Math.min(session.activeIndex, this.tabs.length - 1)]
    this.activate(active.id)
  }

  create(url: string = NEW_TAB_URL, activate = true): number {
    const tab = this.add({ url, title: '', favicon: null, pinned: false })
    if (activate) this.activate(tab.id)
    return tab.id
  }

  close(id: number): void {
    const index = this.tabs.findIndex((t) => t.id === id)
    if (index < 0) return
    if (this.split && (this.split.a === id || this.split.b === id)) this.split = null
    const [tab] = this.tabs.splice(index, 1)
    if (!isNewTabUrl(tab.url)) {
      this.closed.push({ url: tab.url, title: tab.title, favicon: tab.favicon, pinned: tab.pinned })
      if (this.closed.length > MAX_CLOSED) this.closed.shift()
    }
    this.destroyView(tab)
    if (this.tabs.length === 0) {
      this.activeId = null
      this.create()
    } else if (this.activeId === id) {
      this.activate(this.tabs[Math.min(index, this.tabs.length - 1)].id)
    } else {
      this.emit()
    }
  }

  activate(id: number): void {
    const tab = this.byId(id)
    if (!tab) return
    if (this.activeId !== id) this.stopFind()
    // Activating a tab outside the split pair leaves split view.
    if (this.split && this.split.a !== id && this.split.b !== id) this.split = null
    this.ensureView(tab)
    const shown = new Set(this.split ? [this.split.a, this.split.b] : [id])
    // Inactive views are detached rather than hidden: Chromium's find-in-page returns no results
    // for a page that went hidden -> visible, but works after a detach/attach.
    for (const other of this.tabs) {
      if (!shown.has(other.id) && other.view) this.opts.win.contentView.removeChildView(other.view)
    }
    for (const sid of shown) {
      const t = this.byId(sid)
      if (!t) continue
      this.ensureView(t)
      this.opts.win.contentView.addChildView(t.view!)
    }
    this.opts.win.contentView.addChildView(this.opts.ui)
    this.activeId = id
    tab.lastActive = Date.now()
    this.layout()
    this.emit()
  }

  cycle(direction: 1 | -1): void {
    if (this.tabs.length < 2 || this.activeId === null) return
    const index = this.tabs.findIndex((t) => t.id === this.activeId)
    const next = (index + direction + this.tabs.length) % this.tabs.length
    this.activate(this.tabs[next].id)
  }

  closeActive(): void {
    if (this.activeId !== null) this.close(this.activeId)
  }

  reopenClosed(): void {
    const saved = this.closed.pop()
    if (!saved) return
    const tab = this.add(saved)
    this.activate(tab.id)
  }

  move(id: number, toIndex: number): void {
    const from = this.tabs.findIndex((t) => t.id === id)
    if (from < 0) return
    const [tab] = this.tabs.splice(from, 1)
    // Pinned tabs stay in the leading group, unpinned tabs after it.
    const pinnedCount = this.tabs.filter((t) => t.pinned).length
    const lo = tab.pinned ? 0 : pinnedCount
    const hi = tab.pinned ? pinnedCount : this.tabs.length
    this.tabs.splice(Math.max(lo, Math.min(hi, toIndex)), 0, tab)
    this.emit()
  }

  pin(id: number, pinned: boolean): void {
    const index = this.tabs.findIndex((t) => t.id === id)
    if (index < 0 || this.tabs[index].pinned === pinned) return
    const [tab] = this.tabs.splice(index, 1)
    tab.pinned = pinned
    this.tabs.splice(this.tabs.filter((t) => t.pinned).length, 0, tab)
    this.emit()
  }

  navigate(input: string): void {
    const tab = this.active()
    const url = resolveInput(input, this.opts.getSettings().searchEngine)
    if (!tab || !url) return
    tab.url = url
    if (tab.view) this.load(tab.view.webContents, url)
    else this.ensureView(tab)
    this.emit()
  }

  home(): void {
    this.navigate(this.opts.getSettings().homepage)
  }

  back(): void {
    this.active()?.view?.webContents.navigationHistory.goBack()
  }

  forward(): void {
    this.active()?.view?.webContents.navigationHistory.goForward()
  }

  reload(): void {
    this.active()?.view?.webContents.reload()
  }

  stop(): void {
    this.active()?.view?.webContents.stop()
  }

  /** Push the current state to the UI (e.g. after a background counter changed). */
  refresh(): void {
    this.emit()
  }

  mute(id: number, muted: boolean): void {
    this.byId(id)?.view?.webContents.setAudioMuted(muted)
    this.emit()
  }

  /** Open a copy of the tab right after it. */
  duplicate(id: number): void {
    const source = this.byId(id)
    if (!source) return
    const at = this.tabs.indexOf(source)
    const copy = this.add({
      url: source.url,
      title: source.title,
      favicon: source.favicon,
      pinned: false
    })
    this.move(copy.id, at + 1)
    this.activate(copy.id)
  }

  /** Close every unpinned tab except this one. */
  closeOthers(id: number): void {
    if (!this.byId(id)) return
    this.activate(id)
    for (const t of [...this.tabs]) if (t.id !== id && !t.pinned) this.close(t.id)
  }

  /** Close the unpinned tabs after this one. */
  closeRight(id: number): void {
    const at = this.tabs.findIndex((t) => t.id === id)
    if (at < 0) return
    for (const t of this.tabs.slice(at + 1)) if (!t.pinned) this.close(t.id)
  }

  reloadTab(id: number): void {
    this.byId(id)?.view?.webContents.reload()
  }

  /** Unload one background tab; it reloads from its URL when activated again. */
  discard(id: number): void {
    const tab = this.byId(id)
    if (!tab?.view || id === this.activeId) return
    if (this.split && (this.split.a === id || this.split.b === id)) return
    const url = tab.view.webContents.getURL()
    if (url) tab.url = url
    tab.loading = false
    this.destroyView(tab)
    this.emit()
  }

  /** Discard tabs idle past the user's threshold (skips active, loading and audible tabs). */
  discardIdle(): void {
    const minutes = this.opts.getSettings().discardAfterMinutes
    if (minutes <= 0) return
    const candidates = this.tabs.map((t) => ({
      id: t.id,
      lastActive: t.lastActive,
      loaded: t.view !== null,
      busy: t.loading || (t.view?.webContents.isCurrentlyAudible() ?? false)
    }))
    for (const id of pickIdleTabs(candidates, this.activeId, Date.now(), minutes * 60_000)) {
      this.discard(id)
    }
  }

  zoom(action: 'in' | 'out' | 'reset'): void {
    const wc = this.active()?.view?.webContents
    if (!wc) return
    wc.setZoomFactor(nextZoom(wc.getZoomFactor(), action))
    this.emit()
  }

  find(text: string, forward: boolean, next: boolean): void {
    const wc = this.active()?.view?.webContents
    if (!wc) return
    if (!text) return this.stopFind()
    // Electron only reports results when findNext is absent (an explicit false yields no events).
    this.findRequest = wc.findInPage(text, next ? { forward, findNext: true } : { forward })
  }

  stopFind(): void {
    const wc = this.active()?.view?.webContents
    if (wc && !wc.isDestroyed()) wc.stopFindInPage('clearSelection')
  }

  /** Per-tab process ids for the memory report; null when the tab has no live page. */
  processIds(): { id: number; title: string; url: string; pid: number | null }[] {
    return this.tabs.map((t) => ({
      id: t.id,
      title: t.title,
      url: t.url,
      pid: t.view ? t.view.webContents.getOSProcessId() : null
    }))
  }

  /** Resize the visible page view to the area below the chrome UI. */
  layout(): void {
    const area = this.opts.getBounds()
    if (!this.split) {
      this.active()?.view?.setBounds(area)
      return
    }
    // Two panes with a 2px gutter. In Arabic the primary pane sits on the right.
    const gap = 2
    const half = Math.floor((area.width - gap) / 2)
    const left: Rectangle = { ...area, width: half }
    const right: Rectangle = { ...area, x: area.x + half + gap, width: area.width - half - gap }
    const rtl = this.opts.getSettings().language === 'ar'
    this.byId(this.split.a)?.view?.setBounds(rtl ? right : left)
    this.byId(this.split.b)?.view?.setBounds(rtl ? left : right)
  }

  print(): void {
    this.active()?.view?.webContents.print()
  }

  toggleDevTools(): void {
    this.active()?.view?.webContents.toggleDevTools()
  }

  /** Show the active tab next to another one (or leave split view). */
  toggleSplit(): void {
    if (this.split) {
      this.split = null
      if (this.activeId !== null) this.activate(this.activeId)
      return
    }
    const active = this.active()
    if (!active) return
    const at = this.tabs.indexOf(active)
    const partner =
      this.tabs[at + 1] ?? this.tabs[at - 1] ?? this.byId(this.create(NEW_TAB_URL, false))
    if (!partner) return
    this.split = { a: active.id, b: partner.id }
    this.activate(active.id)
  }

  owns(wc: WebContents): boolean {
    return this.tabs.some((t) => t.view?.webContents === wc)
  }

  /** Live drift:// internal pages, used to push data events to them. */
  pageContents(): WebContents[] {
    return this.tabs
      .filter((t) => t.view && t.url.startsWith(DRIFT_SCHEME + '//'))
      .map((t) => t.view!.webContents)
  }

  snapshot(): TabsState {
    return {
      tabs: this.tabs.map((t) => this.info(t)),
      activeId: this.activeId,
      split: this.split ? [this.split.a, this.split.b] : null
    }
  }

  /** Write the session immediately (call on quit). */
  flush(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = null
    this.opts.saveSession({
      tabs: this.tabs.map(({ url, title, favicon, pinned }) => ({ url, title, favicon, pinned })),
      activeIndex: Math.max(
        0,
        this.tabs.findIndex((t) => t.id === this.activeId)
      )
    })
  }

  private add(saved: SavedTab): Tab {
    const tab: Tab = {
      ...saved,
      id: ++this.seq,
      loading: false,
      view: null,
      lastRecordedUrl: '',
      lastActive: Date.now()
    }
    // Pinned tabs live in the leading group; everything else appends.
    const at = saved.pinned ? this.tabs.filter((t) => t.pinned).length : this.tabs.length
    this.tabs.splice(at, 0, tab)
    this.emit()
    return tab
  }

  private byId(id: number): Tab | undefined {
    return this.tabs.find((t) => t.id === id)
  }

  private active(): Tab | undefined {
    return this.activeId === null ? undefined : this.byId(this.activeId)
  }

  private info(t: Tab): TabInfo {
    const nav = t.view?.webContents.navigationHistory
    return {
      id: t.id,
      url: t.url,
      title: t.title,
      favicon: t.favicon,
      loading: t.loading,
      canGoBack: nav?.canGoBack() ?? false,
      canGoForward: nav?.canGoForward() ?? false,
      pinned: t.pinned,
      zoom: t.view?.webContents.getZoomFactor() ?? 1,
      audible: t.view?.webContents.isCurrentlyAudible() ?? false,
      muted: t.view?.webContents.audioMuted ?? false,
      blocked: t.view ? this.opts.getBlocked(t.view.webContents.id) : 0,
      discarded: t.view === null
    }
  }

  private load(wc: WebContents, url: string): void {
    // ERR_ABORTED fires on redirects and user stops; the navigation events carry the real state.
    wc.loadURL(url).catch(() => undefined)
  }

  private ensureView(tab: Tab): void {
    if (tab.view) return
    const view = new WebContentsView({
      webPreferences: {
        partition: this.opts.partition,
        preload: this.opts.preload,
        contextIsolation: true,
        sandbox: true,
        nodeIntegration: false
      }
    })
    tab.view = view
    this.wire(tab, view.webContents)
    this.load(view.webContents, tab.url)
  }

  private destroyView(tab: Tab): void {
    if (!tab.view) return
    this.opts.win.contentView.removeChildView(tab.view)
    if (!tab.view.webContents.isDestroyed()) tab.view.webContents.close()
    tab.view = null
  }

  private wire(tab: Tab, wc: WebContents): void {
    this.opts.bindInput(wc)
    wc.setWindowOpenHandler(({ url }) => {
      this.create(url)
      return { action: 'deny' }
    })
    wc.on('page-title-updated', (_e, title) => {
      tab.title = title
      this.emit()
    })
    wc.on('page-favicon-updated', (_e, favicons) => {
      tab.favicon = favicons[0] ?? null
      if (tab.favicon) this.opts.onFavicon?.(wc.getURL(), tab.favicon)
      this.emit()
    })
    wc.on('did-start-loading', () => {
      tab.loading = true
      this.emit()
    })
    wc.on('did-stop-loading', () => {
      tab.loading = false
      const url = wc.getURL()
      if (url) tab.url = url
      // Sites that declare no icon usually still serve /favicon.ico.
      if (!tab.favicon && /^https?:/i.test(url)) tab.favicon = new URL(url).origin + '/favicon.ico'
      if (url && url !== tab.lastRecordedUrl) {
        tab.lastRecordedUrl = url
        this.opts.onVisit?.(url, tab.title)
      }
      this.emit()
    })
    wc.on('did-navigate', (_e, url) => {
      // A different site has a different icon; drop the old one until the new page reports it.
      if (originOf(url) !== originOf(tab.url)) tab.favicon = null
      tab.url = url
      this.emit()
    })
    wc.on('audio-state-changed', () => this.emit())
    // In split view the focused pane is the "active" tab (address bar, shortcuts follow it).
    wc.on('focus', () => {
      if (
        this.split &&
        (this.split.a === tab.id || this.split.b === tab.id) &&
        this.activeId !== tab.id
      ) {
        this.activeId = tab.id
        this.emit()
      }
    })
    wc.on('found-in-page', (_e, result) => {
      if (tab.id === this.activeId && result.requestId >= this.findRequest) {
        this.opts.onFind({ active: result.activeMatchOrdinal, total: result.matches })
      }
    })
    wc.on('did-navigate-in-page', (_e, url, isMainFrame) => {
      if (!isMainFrame) return
      tab.url = url
      this.emit()
    })
  }

  /** Coalesce bursts of page events into one UI update and one delayed session save. */
  private emit(): void {
    if (!this.emitQueued) {
      this.emitQueued = true
      queueMicrotask(() => {
        this.emitQueued = false
        this.opts.onChange(this.snapshot())
      })
    }
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => this.flush(), SAVE_DELAY_MS)
  }
}
