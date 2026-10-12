import { resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { net, protocol, type Session } from 'electron'
import { DRIFT_PAGES } from '@shared/constants'

const PAGES_ENTRY = '/pages.html'
const RENDERER_ROOT = resolve(__dirname, '../renderer')
const registered = new WeakSet<Session>()

export function registerDriftScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: 'drift', privileges: { standard: true, secure: true, supportFetchAPI: true } }
  ])
}

/**
 * Serves drift://<page> from the renderer bundle: "/" is the pages entry (which routes by
 * hostname), anything else is an asset of that bundle. In dev the assets come from Vite.
 */
export function registerDriftHandler(ses: Session): void {
  if (registered.has(ses)) return
  registered.add(ses)
  ses.protocol.handle('drift', (request) => {
    const url = new URL(request.url)
    if (!(DRIFT_PAGES as readonly string[]).includes(url.hostname)) {
      return new Response('Not found', { status: 404 })
    }
    const path = url.pathname === '/' ? PAGES_ENTRY : url.pathname
    const dev = process.env['ELECTRON_RENDERER_URL']
    if (dev) return net.fetch(dev + path + url.search)

    const file = resolve(RENDERER_ROOT, '.' + path)
    if (!file.startsWith(RENDERER_ROOT + sep)) return new Response('Forbidden', { status: 403 })
    return net.fetch(pathToFileURL(file).toString())
  })
}
