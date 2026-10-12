import { app } from 'electron'
import electronUpdater from 'electron-updater'

// electron-updater is CommonJS: named ESM imports fail at runtime, so read it off the default export.
const { autoUpdater } = electronUpdater

const CHECK_DELAY_MS = 10_000

/**
 * Checks GitHub Releases for a newer version shortly after launch and installs it on quit.
 * Skipped in development and for the portable build (it has no installer to update).
 */
export function setupAutoUpdate(): void {
  if (!app.isPackaged || process.env['PORTABLE_EXECUTABLE_DIR']) return
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.on('error', (error) => console.warn('[updater]', error.message))
  setTimeout(
    () => void autoUpdater.checkForUpdatesAndNotify().catch(() => undefined),
    CHECK_DELAY_MS
  )
}
