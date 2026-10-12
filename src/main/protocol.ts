import { protocol, session } from 'electron'
import { NORMAL_PARTITION } from '@shared/constants'

export function registerDriftScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: 'drift', privileges: { standard: true, secure: true, supportFetchAPI: true } }
  ])
}

const TITLES: Record<string, string> = { newtab: 'New Tab' }

const page = (title: string): string =>
  `<!doctype html><meta charset="utf-8"><title>${title}</title>` +
  '<style>body{margin:0;height:100vh;display:grid;place-items:center;' +
  'font:600 32px system-ui;background:#FEF9F1;color:#0A3F43}</style><body>Drift'

/** Phase 4 replaces these placeholders with the real drift:// pages. */
export function registerDriftHandler(): void {
  session.fromPartition(NORMAL_PARTITION).protocol.handle('drift', (request) => {
    const host = new URL(request.url).hostname
    return new Response(page(TITLES[host] ?? host), {
      headers: { 'content-type': 'text/html; charset=utf-8' }
    })
  })
}
