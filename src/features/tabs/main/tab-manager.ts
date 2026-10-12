import { WebContentsView, type BrowserWindow, type Rectangle, type WebContents } from 'electron'
import { resolveInput } from '@shared/url'
import { DRIFT_SCHEME, NEW_TAB_URL } from '@shared/constants'
import { isNewTabUrl } from '@shared/url'
import type { SavedTab, SessionData, Settings, TabInfo, TabsState } from '@shared/types'

interface Tab extends SavedTab {
  id: number
  loading: boolean
  view: WebContentsView | null
  lastRecordedUrl: string
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
  loadSession: () => SessionData
  saveSession: (session: SessionData) => void
}

const MAX_CLOSED = 25
const SAVE_DELAY_MS = 500

export class TabManager {
  private tabs: Tab[] = []
  private activeId: number | null = null
  private closed: SavedTab[] = []
  private seq = 0
  private emitQueued = false
  private saveTimer: NodeJS.Timeout | null = null

  constructor(private readonly opts: TabManagerOptions) {}

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
    const tab = this.find(id)
    if (!tab) return
    this.ensureView(tab)
    for (const other of this.tabs) other.view?.setVisible(other.id === id)
    this.activeId = id
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

  /** Resize the visible page view to the area below the chrome UI. */
  layout(): void {
    this.active()?.view?.setBounds(this.opts.getBounds())
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
    return { tabs: this.tabs.map((t) => this.info(t)), activeId: this.activeId }
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
    const tab: Tab = { ...saved, id: ++this.seq, loading: false, view: null, lastRecordedUrl: '' }
    // Pinned tabs live in the leading group; everything else appends.
    const at = saved.pinned ? this.tabs.filter((t) => t.pinned).length : this.tabs.length
    this.tabs.splice(at, 0, tab)
    this.emit()
    return tab
  }

  private find(id: number): Tab | undefined {
    return this.tabs.find((t) => t.id === id)
  }

  private active(): Tab | undefined {
    return this.activeId === null ? undefined : this.find(this.activeId)
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
    view.setVisible(false)
    this.opts.win.contentView.addChildView(view)
    this.opts.win.contentView.addChildView(this.opts.ui)
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
      if (url && url !== tab.lastRecordedUrl) {
        tab.lastRecordedUrl = url
        this.opts.onVisit?.(url, tab.title)
      }
      this.emit()
    })
    wc.on('did-navigate', (_e, url) => {
      tab.url = url
      this.emit()
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
