import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'

export interface Loopback {
  redirectUri: string
  /** Resolves with the authorization code, rejects on denial, bad state or timeout. */
  code: Promise<string>
  close: () => void
}

const TIMEOUT_MS = 3 * 60 * 1000

const page = (message: string): string =>
  '<!doctype html><meta charset="utf-8"><title>Drift</title>' +
  '<style>body{margin:0;height:100vh;display:grid;place-items:center;' +
  'font:600 22px system-ui;background:#FEF9F1;color:#0A3F43}</style>' +
  `<body><div>${message}</div>`

/**
 * One-shot HTTP server on 127.0.0.1 that receives the OAuth redirect. Bound to the loopback
 * interface only, accepts a single matching request, then shuts down.
 */
export function startLoopback(expectedState: string, host = '127.0.0.1'): Promise<Loopback> {
  return new Promise((resolveStart, rejectStart) => {
    let finish: (error: Error | null, code?: string) => void
    const code = new Promise<string>((resolve, reject) => {
      finish = (error, value) => {
        clearTimeout(timer)
        server.close()
        if (error) reject(error)
        else resolve(value!)
      }
    })
    // Avoid an unhandled rejection if nobody awaits the code (e.g. cancelled before use).
    code.catch(() => undefined)

    const timer = setTimeout(() => finish(new Error('timeout')), TIMEOUT_MS)

    const server: Server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      const params = url.searchParams
      if (!params.has('code') && !params.has('error')) {
        res.writeHead(404).end()
        return
      }
      const error = params.get('error')
      const ok = !error && params.get('state') === expectedState && params.get('code')
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end(
        page(ok ? 'تم تسجيل الدخول. ارجع إلى Drift ✓' : 'Sign-in failed. You can close this tab.')
      )
      if (ok) finish(null, params.get('code')!)
      else finish(new Error(error ?? 'state-mismatch'))
    })

    server.once('error', rejectStart)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo
      resolveStart({
        redirectUri: `http://${host}:${port}`,
        code,
        close: () => finish(new Error('cancelled'))
      })
    })
  })
}
