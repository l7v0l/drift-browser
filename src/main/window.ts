import { join } from 'node:path'
import { BrowserWindow, session, WebContentsView, type Rectangle, type WebContents } from 'electron'
import { CHROME_HEIGHT, NEW_TAB_URL, NORMAL_PARTITION } from '@shared/constants'
import type { EventChannel, IpcEventMap } from '@shared/ipc-types'
import { DownloadManager } from '@features/downloads/main/downloads'
import { setBookmarkFavicon } from '@features/bookmarks/main/bookmarks'
import { recordVisit } from '@features/history/main/history'
import { TabManager } from '@features/tabs/main/tab-manager'
import { bindShortcuts, type ShortcutId } from '@features/tabs/main/shortcuts'
import { send } from './ipc/send'
import { registerDriftHandler } from './protocol'
import { attachRequestPipeline } from './requests'
import { accountService, adblock } from './services'
import { getSettings, store } from './store'

let normalDownloads: DownloadManager | null = null
let privateCount = 0
let hasShownIntro = false

/**
 * One browser window = a BrowserWindow holding the chrome UI view (React) plus one
 * WebContentsView per loaded tab. The UI view sits on top and normally covers only the
 * chrome strip; it grows to the full window while an overlay (dropdown/menu) is open.
 */
export class AppWindow {
  static readonly all = new Set<AppWindow>()

  readonly win: BrowserWindow
  readonly ui: WebContentsView
  readonly tabs: TabManager
  readonly downloads: DownloadManager
  readonly isPrivate: boolean
  /** First normal window of the launch: shows the intro animation and welcome prompt. */
  readonly intro: boolean
  private readonly primary: boolean
  private chromeHeight = CHROME_HEIGHT
  private overlay = false

  /** `showAfter` delays showing the window (e.g. until the startup splash has played). */
  static open(isPrivate = false, showAfter?: Promise<void>): AppWindow {
    return new AppWindow(isPrivate, showAfter)
  }

  static fromSender(wc: WebContents): AppWindow | undefined {
    for (const w of AppWindow.all) {
      if (w.ui.webContents === wc || w.tabs.owns(wc)) return w
    }
    return undefined
  }

  /** Push an event to every window (settings, bookmarks). */
  static broadcast<C extends EventChannel>(channel: C, payload: IpcEventMap[C]): void {
    for (const w of AppWindow.all) w.emit(channel, payload)
  }

  private constructor(isPrivate: boolean, showAfter?: Promise<void>) {
    this.isPrivate = isPrivate
    this.primary = !isPrivate && ![...AppWindow.all].some((w) => !w.isPrivate)
    this.intro = this.primary && !hasShownIntro
    if (this.intro) hasShownIntro = true
    // Private partitions have no "persist:" prefix, so cookies and cache stay in memory only.
    const partition = isPrivate ? `drift-private-${++privateCount}` : NORMAL_PARTITION
    const ses = session.fromPartition(partition)
    registerDriftHandler(ses)
    attachRequestPipeline(ses, {
      adblock,
      getEmail: () => (isPrivate ? null : (accountService.get()?.email ?? null))
    })

    if (isPrivate) this.downloads = new DownloadManager(ses, false)
    else this.downloads = normalDownloads ??= new DownloadManager(ses, true)

    this.win = new BrowserWindow({
      width: 1280,
      height: 800,
      minWidth: 480,
      minHeight: 320,
      show: false,
      title: isPrivate ? 'Drift (Private)' : 'Drift',
      icon: join(__dirname, '../../build/icon.png'),
      autoHideMenuBar: true
    })
    this.win.removeMenu()

    const preload = join(__dirname, '../preload/index.js')
    this.ui = new WebContentsView({
      webPreferences: {
        preload,
        additionalArguments: ['--drift-ui'],
        contextIsolation: true,
        sandbox: true,
        nodeIntegration: false
      }
    })
    this.ui.setBackgroundColor('#00000000')
    this.win.contentView.addChildView(this.ui)

    this.tabs = new TabManager({
      win: this.win,
      ui: this.ui,
      partition,
      preload,
      getBounds: () => this.pageBounds(),
      getSettings,
      onChange: (state) => send(this.ui.webContents, 'tabs:changed', state),
      bindInput: (wc) => bindShortcuts(wc, (id) => this.runShortcut(id)),
      onVisit: isPrivate ? undefined : recordVisit,
      getBlocked: (webContentsId) => adblock.blockedFor(webContentsId),
      onFind: (result) => send(this.ui.webContents, 'find:result', result),
      onFavicon: isPrivate
        ? undefined
        : (url, favicon) => {
            const changed = setBookmarkFavicon(url, favicon)
            if (changed) AppWindow.broadcast('bookmarks:changed', changed)
          },
      loadSession: () => (this.primary ? store.get('session') : { tabs: [], activeIndex: 0 }),
      saveSession: (data) => {
        if (this.primary) store.set('session', data)
      }
    })

    bindShortcuts(this.ui.webContents, (id) => this.runShortcut(id))
    const stopDownloads = this.downloads.subscribe((list) => this.emit('downloads:changed', list))
    this.win.on('resize', () => this.layout())
    this.win.on('enter-full-screen', () => this.layout())
    this.win.on('leave-full-screen', () => this.layout())
    this.win.on('closed', () => {
      stopDownloads()
      this.tabs.dispose()
      AppWindow.all.delete(this)
    })
    this.layout()
    AppWindow.all.add(this)

    this.ui.webContents.once('did-finish-load', () => {
      this.tabs.restore()
      void (showAfter ?? Promise.resolve()).then(() => {
        if (!this.win.isDestroyed()) this.win.show()
      })
    })
    if (process.env['ELECTRON_RENDERER_URL']) {
      void this.ui.webContents.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      void this.ui.webContents.loadFile(join(__dirname, '../renderer/index.html'))
    }
  }

  /** Send to the chrome UI and to any open drift:// pages of this window. */
  emit<C extends EventChannel>(channel: C, payload: IpcEventMap[C]): void {
    send(this.ui.webContents, channel, payload)
    for (const wc of this.tabs.pageContents()) send(wc, channel, payload)
  }

  setOverlay(open: boolean): void {
    this.overlay = open
    this.layout()
  }

  setChromeHeight(height: number): void {
    this.chromeHeight = Math.max(0, Math.round(height))
    this.layout()
  }

  focusAddress(): void {
    this.ui.webContents.focus()
    send(this.ui.webContents, 'ui:focus-address', null)
  }

  private pageBounds(): Rectangle {
    const { width, height } = this.win.getContentBounds()
    return { x: 0, y: this.chromeHeight, width, height: Math.max(0, height - this.chromeHeight) }
  }

  private layout(): void {
    const { width, height } = this.win.getContentBounds()
    this.ui.setBounds({ x: 0, y: 0, width, height: this.overlay ? height : this.chromeHeight })
    this.tabs.layout()
  }

  private runShortcut(id: ShortcutId): void {
    switch (id) {
      case 'new-tab':
        this.tabs.create(NEW_TAB_URL)
        this.focusAddress()
        break
      case 'close-tab':
        this.tabs.closeActive()
        break
      case 'reopen-tab':
        this.tabs.reopenClosed()
        break
      case 'focus-address':
        this.focusAddress()
        break
      case 'next-tab':
        this.tabs.cycle(1)
        break
      case 'prev-tab':
        this.tabs.cycle(-1)
        break
      case 'reload':
        this.tabs.reload()
        break
      case 'fullscreen':
        this.win.setFullScreen(!this.win.isFullScreen())
        break
      case 'find':
        this.ui.webContents.focus()
        send(this.ui.webContents, 'ui:open-find', null)
        break
      case 'zoom-in':
        this.tabs.zoom('in')
        break
      case 'zoom-out':
        this.tabs.zoom('out')
        break
      case 'zoom-reset':
        this.tabs.zoom('reset')
        break
      case 'history':
        this.tabs.create('drift://history')
        break
      case 'downloads':
        this.tabs.create('drift://downloads')
        break
      case 'bookmarks':
        this.tabs.create('drift://bookmarks')
        break
      case 'print':
        this.tabs.print()
        break
      case 'devtools':
        this.tabs.toggleDevTools()
        break
      case 'new-window':
        AppWindow.open(false)
        break
      case 'private-window':
        AppWindow.open(true)
        break
    }
  }
}
