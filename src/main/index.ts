import { app, BrowserWindow } from 'electron'
import { registerIpc } from './ipc'
import { registerDriftHandler, registerDriftScheme } from './protocol'
import { AppWindow } from './window'

let current: AppWindow | null = null

registerDriftScheme()

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = current?.win
    if (!win) return
    if (win.isMinimized()) win.restore()
    win.focus()
  })

  void app.whenReady().then(() => {
    registerDriftHandler()
    registerIpc(() => current)
    current = new AppWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) current = new AppWindow()
    })
  })

  app.on('before-quit', () => current?.tabs.flush())
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
