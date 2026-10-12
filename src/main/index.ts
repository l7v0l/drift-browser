import { app, BrowserWindow } from 'electron'
import { registerIpc } from './ipc'
import { registerDriftScheme } from './protocol'
import { AppWindow } from './window'

registerDriftScheme()

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = [...AppWindow.all][0]?.win
    if (!win) return
    if (win.isMinimized()) win.restore()
    win.focus()
  })

  void app.whenReady().then(() => {
    registerIpc()
    AppWindow.open(false)
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) AppWindow.open(false)
    })
  })

  app.on('before-quit', () => {
    for (const w of AppWindow.all) w.tabs.flush()
  })
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
