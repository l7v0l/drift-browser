# Architecture

Drift is an Electron app. Code is split by process first (`src/main`, `src/preload`, `src/renderer`) and by feature second (`src/features/<feature>`).

## Layout

```
src/
├─ main/            Electron main process: window, IPC wiring, protocol, store, updater
│  ├─ index.ts      app lifecycle
│  ├─ window.ts     AppWindow: BrowserWindow + chrome view + tab manager (one per window)
│  ├─ ipc/          IPC registration and sender authorization
│  ├─ protocol.ts   drift:// scheme (serves internal pages)
│  ├─ services.ts   process-wide services (account)
│  ├─ store/        electron-store schema (settings, session, history, bookmarks, ...)
│  ├─ config.ts     build-time OAuth client ids (from .env, see docs/SIGN_IN.md)
│  └─ updater.ts    electron-updater against GitHub Releases
├─ preload/         contextBridge: exposes the typed `window.drift` API
├─ shared/          code used by every process: types, IPC contract, constants, url helpers
├─ renderer/        the React apps
│  ├─ index.html    browser chrome (tab strip, toolbar, dialogs)
│  ├─ pages.html    drift:// internal pages, one lazy chunk per page
│  ├─ i18n/         ar.json, en.json
│  └─ hooks/ components/ styles/
└─ features/<name>/
   ├─ main/         main-process logic for the feature
   └─ renderer/     React components and stores for the feature
```

Features: `tabs`, `addressbar`, `bookmarks`, `history`, `downloads`, `newtab`, `settings`, `find`, `about`, `account`, `menu`, `passwords`, `extensions`, `notices`.

`tests/` holds Vitest tests for the pure logic of each feature.

## How a window works

A window is a `BrowserWindow` with several `WebContentsView`s stacked inside it:

- one **chrome view** (React, `renderer/index.html`) on top: tabs, address bar, bookmarks bar, find bar, dropdowns, intro and sign-in dialogs;
- one **page view** per loaded tab, below the chrome. Inactive tabs are detached rather than hidden (Chromium's find-in-page misbehaves for hidden → visible views).

The chrome view is transparent and only as tall as the chrome. Dropdowns need to draw over native page views, so while one is open the renderer calls `ui:set-overlay` and main grows the chrome view to the full window (`useOverlay`).

`TabManager` (`features/tabs/main`) owns tab state. Tabs restored from a session start *discarded* (no view); the view is created on first activation. A timer discards idle background tabs (`pickIdleTabs`). Every change goes through a coalesced `emit()` that pushes a snapshot to the chrome and schedules a debounced session save.

## Split view

`TabManager` can show two tabs at once (`toggleSplit`). Both views are attached side by side (the primary pane is on the right in Arabic); the focused pane becomes the "active" tab, so the address bar and shortcuts follow it. Activating a tab outside the pair leaves split view.

## Passwords

Signed-in forms are noticed by `src/preload/forms.ts`, which runs in the preload's isolated world on http(s) pages only. It reports a login over a dedicated IPC channel and asks for credentials to autofill. `features/passwords/main/channel.ts` re-checks every call (top frame, real origin, normal window, HTTPS or localhost) and keeps a pending capture in memory until the user answers the notice bar. Passwords are encrypted with `safeStorage` before reaching `electron-store`. The pure rules (`pickCredentials`, `decideCapture`) are in `decide.ts` and unit-tested.

## Extensions

`features/extensions/main` installs extensions from the Chrome Web Store into the normal session using `electron-chrome-web-store` (MIT) and Electron's built-in `session.extensions`. See [docs/EXTENSIONS.md](docs/EXTENSIONS.md) for what that does and does not support.

## Ad blocker

`features/adblock/main/adblock.ts` wraps Ghostery's engine (MPL-2.0). The engine is downloaded once and cached in the user data folder. Electron allows a single `webRequest.onBeforeRequest` handler per session, so `main/requests.ts` owns it and runs sign-in pre-fill and then ad blocking. Cosmetic filters are injected by a frame preload registered on each session. Blocked counts are kept per webContents and reset on navigation; the allowlist and on/off switch are ordinary settings.

## Startup

`main/splash.ts` shows a small frameless animated window immediately; the main window is created hidden and shown once the chrome has loaded and the splash has played. After an update, the chrome shows a "What's new" dialog from `shared/changelog.ts`.

## IPC

`src/shared/ipc-types.ts` is the single source of truth.

- `IpcInvokeMap` – renderer → main requests (typed args and result)
- `IpcEventMap` – main → renderer pushes

Adding a channel means: add it to the map, add it to the `invokeAllow` / `eventAllow` records (the compiler enforces this), implement the handler in `main/ipc/index.ts`. The handler type is derived from the map, so a missing or mistyped handler does not compile.

### Security model

- Every view uses `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`.
- The preload exposes `window.drift` **only** to the chrome view (flagged with `--drift-ui`) and to `drift://` pages. Ordinary websites get nothing.
- Main re-checks every call (`authorize` in `main/ipc`): the chrome view may call any channel; a `drift://` page may call only `PAGE_INVOKE_CHANNELS`.
- OAuth runs in the system browser with PKCE and a one-shot loopback server; only the profile (email, name, picture) is stored, and only if the user chooses Save.

## drift:// pages

`drift://newtab|settings|history|bookmarks|downloads|about` are registered as a privileged scheme. The protocol handler serves `pages.html` (which routes by hostname and lazy-loads one page component) and the renderer bundle's assets. In development assets come from the Vite dev server.

## Data

`electron-store` (`drift.json` in the user data folder): settings, session, history (capped), bookmarks, shortcuts, downloads, account. Private windows use an in-memory partition and never write history, session or downloads to disk.

## Adding a feature

1. Create `src/features/<name>/main` and/or `renderer`.
2. Add types to `shared/types.ts` and channels to `shared/ipc-types.ts`.
3. Put logic that does not need Electron in its own pure module and cover it in `tests/`.
4. Add strings to both `renderer/i18n/ar.json` and `en.json`.
5. For a new internal page, add its name to `DRIFT_PAGES` and a lazy route in `renderer/pages/main.tsx`.

## Conventions

- TypeScript strict, ESLint + Prettier (`npm run lint`, `npm run format`)
- Conventional Commits (`feat:`, `fix:`, `chore:` …)
- RTL-safe styling: logical properties (`ms-`, `me-`, `start`, `end`), mirror directional icons
