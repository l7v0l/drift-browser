import { BrowserWindow } from 'electron'

const MIN_VISIBLE_MS = 2400

// Self-contained page: no network, no preload. Mirrors the logo at assets/logo.svg.
const HTML = `<!doctype html><meta charset="utf-8"><title>Drift</title>
<style>
  :root { --bg:#fbf6ee; --ink:#1d1c17; --muted:#5f6869; --line:#efe6d8; }
  @media (prefers-color-scheme: dark) { :root { --bg:#1f1a17; --ink:#fdf9f4; --muted:#d7ccc0; --line:#3d352f; } }
  html,body { margin:0; height:100%; background:transparent; overflow:hidden; user-select:none; -webkit-app-region:drag; }
  .card { position:absolute; inset:8px; border-radius:32px; background:var(--bg); border:1px solid var(--line);
    box-shadow:0 24px 64px -8px rgba(31,26,23,.28); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px;
    font-family:'Segoe UI',system-ui,sans-serif; color:var(--ink); animation:fade .35s ease-out both; }
  .name { font-size:44px; font-weight:700; letter-spacing:-.02em; opacity:0; animation:rise .5s 1.25s ease-out forwards; }
  .tag { font-size:17px; color:var(--muted); margin-top:-14px; opacity:0; animation:rise .5s 1.5s ease-out forwards; }
  .bar { width:120px; height:3px; border-radius:3px; background:var(--line); overflow:hidden; opacity:0; animation:rise .4s 1.7s ease-out forwards; }
  .bar i { display:block; height:100%; width:40%; border-radius:3px; background:#0f5257; animation:slide 1.1s 1.7s ease-in-out infinite; }
  .sq { transform-box:fill-box; transform-origin:center; animation:pop .6s cubic-bezier(.2,1.4,.4,1) both; }
  .wave { stroke-dasharray:1 1; stroke-dashoffset:1; animation:draw .9s .45s ease-out forwards; }
  .arrow { transform-box:fill-box; transform-origin:center; opacity:0; animation:arrow .55s 1.15s cubic-bezier(.2,1.6,.4,1) forwards; }
  @keyframes fade { from { opacity:0; transform:scale(.96) } to { opacity:1; transform:none } }
  @keyframes pop { from { transform:scale(.4) rotate(-8deg); opacity:0 } to { transform:none; opacity:1 } }
  @keyframes draw { to { stroke-dashoffset:0 } }
  @keyframes arrow { from { opacity:0; transform:translate(-28px,14px) scale(.3) } to { opacity:1; transform:none } }
  @keyframes rise { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
  @keyframes slide { 0% { transform:translateX(-100%) } 100% { transform:translateX(300%) } }
  @media (prefers-reduced-motion: reduce) { * { animation-duration:.01s !important; animation-delay:0s !important; } }
</style>
<div class="card">
  <svg viewBox="0 0 512 512" width="150" height="150" aria-hidden="true">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16656B"/><stop offset="1" stop-color="#0A3F43"/></linearGradient>
      <linearGradient id="wv" x1="80" y1="0" x2="400" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FEF9F1"/><stop offset="1" stop-color="#F4BE4E"/></linearGradient>
    </defs>
    <rect class="sq" width="512" height="512" rx="124" fill="url(#bg)"/>
    <path class="wave" pathLength="1" d="M96 316 C146 212 222 212 258 276 C294 340 340 338 372 296" fill="none" stroke="url(#wv)" stroke-width="52" stroke-linecap="round"/>
    <g class="arrow"><path d="M352 262 L430 262 L430 340 Z" fill="#FF7A59" stroke="#FF7A59" stroke-width="20" stroke-linejoin="round" transform="rotate(-56 372 296) translate(-14 34)"/></g>
  </svg>
  <div class="name">Drift</div>
  <div class="tag">Browse light.</div>
  <div class="bar"><i></i></div>
</div>`

export interface Splash {
  /** Resolves once the splash has been visible long enough for the animation to play. */
  minTimeElapsed: Promise<void>
  /** Fade out and close. */
  close: () => void
}

/** Frameless animated splash shown the moment the app starts, before the main window exists. */
export function showSplash(): Splash {
  const win = new BrowserWindow({
    width: 440,
    height: 440,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    show: false,
    center: true,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
  })
  void win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(HTML)}`)
  win.once('ready-to-show', () => win.show())

  let shownAt = Date.now()
  win.once('show', () => (shownAt = Date.now()))
  const minTimeElapsed = new Promise<void>((resolve) => {
    // Start the clock now: if the app is slow to start the splash is already late.
    setTimeout(resolve, MIN_VISIBLE_MS)
  })

  return {
    minTimeElapsed,
    close: () => {
      const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt))
      setTimeout(() => {
        if (!win.isDestroyed()) win.close()
      }, remaining)
    }
  }
}
