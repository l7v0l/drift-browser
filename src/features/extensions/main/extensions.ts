import { readFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { app, BrowserWindow, dialog, session, type Extension, type Session } from 'electron'
import {
  installChromeWebStore,
  installExtension,
  uninstallExtension
} from 'electron-chrome-web-store'
import { NORMAL_PARTITION } from '@shared/constants'
import type { ExtensionSummary } from '@shared/types'
import { getSettings } from '../../../main/store'
import { parseExtensionId } from './id'

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
}

const normalSession = (): Session => session.fromPartition(NORMAL_PARTITION)
const extensionsDir = (): string => join(app.getPath('userData'), 'Extensions')

/** Largest icon the manifest declares, as a data URL. */
function iconOf(ext: Extension): string | null {
  const m = ext.manifest ?? {}
  const declared = m.action?.default_icon ?? m.browser_action?.default_icon ?? m.icons
  let rel: string | undefined
  if (typeof declared === 'string') rel = declared
  else if (declared && typeof declared === 'object') {
    const best = Object.keys(declared)
      .map(Number)
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => b - a)[0]
    rel = declared[String(best)]
  }
  if (!rel) return null
  try {
    const mime = MIME[extname(rel).toLowerCase()] ?? 'image/png'
    return `data:${mime};base64,${readFileSync(join(ext.path, rel)).toString('base64')}`
  } catch {
    return null
  }
}

function summarize(ext: Extension): ExtensionSummary {
  const m = ext.manifest ?? {}
  const page: string | undefined = m.options_page ?? m.options_ui?.page
  const description =
    typeof m.description === 'string' && !m.description.startsWith('__MSG_') ? m.description : ''
  return {
    id: ext.id,
    name: ext.name,
    version: ext.version,
    description,
    icon: iconOf(ext),
    hasPopup: Boolean(m.action?.default_popup ?? m.browser_action?.default_popup),
    optionsUrl: page ? `${ext.url}${page}` : null
  }
}

export const listExtensions = (): ExtensionSummary[] =>
  normalSession()
    .extensions.getAllExtensions()
    .map(summarize)
    .sort((a, b) => a.name.localeCompare(b.name))

/**
 * Chrome Web Store support for normal windows: the store's "Add to Chrome" button installs into
 * Drift, and installed extensions load into every tab. Private windows use no extensions.
 */
export async function setupExtensions(): Promise<void> {
  await installChromeWebStore({
    session: normalSession(),
    extensionsPath: extensionsDir(),
    autoUpdate: true,
    beforeInstall: async (details) => {
      const permissions = (details.manifest.permissions ?? []).join(', ') || '-'
      const parent = details.browserWindow ?? BrowserWindow.getFocusedWindow() ?? undefined
      const options = {
        type: 'question' as const,
        buttons: ['Add extension', 'Cancel'],
        defaultId: 1,
        cancelId: 1,
        title: 'Drift',
        message: `Add "${details.localizedName}"?`,
        detail: `It can: ${permissions}`
      }
      const { response } = parent
        ? await dialog.showMessageBox(parent, options)
        : await dialog.showMessageBox(options)
      return { action: response === 0 ? 'allow' : 'deny' }
    }
  })
}

export async function installById(input: string): Promise<ExtensionSummary[]> {
  const id = parseExtensionId(input)
  if (!id) throw new Error('invalid-extension-id')
  await installExtension(id, { session: normalSession(), extensionsPath: extensionsDir() })
  return listExtensions()
}

export async function removeById(id: string): Promise<ExtensionSummary[]> {
  await uninstallExtension(id, { session: normalSession(), extensionsPath: extensionsDir() })
  return listExtensions()
}

/** Open an extension's popup under the toolbar. Returns 'options' when it only has an options page. */
export function openExtensionPopup(
  parent: BrowserWindow,
  id: string
): 'popup' | 'options' | 'none' {
  const ext = normalSession().extensions.getExtension(id)
  if (!ext) return 'none'
  const m = ext.manifest ?? {}
  const popup: string | undefined = m.action?.default_popup ?? m.browser_action?.default_popup
  if (!popup) return summarize(ext).optionsUrl ? 'options' : 'none'

  const area = parent.getContentBounds()
  const width = 380
  const rtl = getSettings().language === 'ar'
  const win = new BrowserWindow({
    parent,
    width,
    height: 540,
    x: rtl ? area.x + 12 : area.x + area.width - width - 12,
    y: area.y + 92,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: { session: normalSession(), sandbox: true, contextIsolation: true }
  })
  win.on('blur', () => win.close())
  void win.loadURL(`${ext.url}${popup}`)
  return 'popup'
}
