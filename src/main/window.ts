import { join } from 'node:path'
import { BrowserWindow, WebContentsView, type Rectangle } from 'electron'
import { CHROME_HEIGHT, NEW_TAB_URL, NORMAL_PARTITION } from '@shared/constants'
import { recordVisit } from '@features/history/main/history'
import { TabManager } from '@features/tabs/main/tab-manager'
import { bindShortcuts, type ShortcutId } from '@features/tabs/main/shortcuts'
import { send } from './ipc/send'
import { getSettings, store } from './store'

/**
 * One browser window = a BrowserWindow holding the chrome UI view (React) plus one
 * WebContentsView per loaded tab. The UI view sits on top and normally covers only the
 * chrome strip; it grows to the full window while an overlay (dropdown/menu) is open.
 */
export class AppWindow {
  readonly win: BrowserWindow
  readonly ui: WebContentsView
  readonly tabs: TabManager
  private chromeHeight = CHROME_HEIGHT
  private overlay = false

  constructor() {
    this.win = new BrowserWindow({
      width: 1280,
      height: 800,
      minWidth: 480,
      minHeight: 320,
      show: false,
      title: 'Drift',
      icon: join(__dirname, '../../build/icon.png'),
      autoHideMenuBar: true
    })
    this.win.removeMenu()

    this.ui = new WebContentsView({
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
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
      partition: NORMAL_PARTITION,
      getBounds: () => this.pageBounds(),
      getSettings,
      onChange: (state) => send(this.ui.webContents, 'tabs:changed', state),
      bindInput: (wc) => bindShortcuts(wc, (id) => this.runShortcut(id)),
      onVisit: recordVisit,
      loadSession: () => store.get('session'),
      saveSession: (session) => store.set('session', session)
    })

    bindShortcuts(this.ui.webContents, (id) => this.runShortcut(id))
    this.win.on('resize', () => this.layout())
    this.win.on('enter-full-screen', () => this.layout())
    this.win.on('leave-full-screen', () => this.layout())
    this.layout()

    this.ui.webContents.once('did-finish-load', () => {
      this.tabs.restore()
      this.win.show()
    })
    if (process.env['ELECTRON_RENDERER_URL']) {
      void this.ui.webContents.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      void this.ui.webContents.loadFile(join(__dirname, '../renderer/index.html'))
    }
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
    }
  }
}
