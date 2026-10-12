# Extensions

Drift can install extensions from the Chrome Web Store (open `drift://extensions`, paste a store link or id, or use the store's "Add to Chrome" button). Installed extensions load into every normal tab and show their icon in the toolbar; clicking an icon opens its popup.

## What works

Extensions are loaded through Electron's built-in extension support. That covers manifest v3 content scripts, `chrome.storage`, `chrome.runtime`, `chrome.scripting` and a partial `chrome.tabs`. Extensions that mostly inject scripts or styles into pages (dark mode, page tweaks, many productivity tools) usually work.

## What does not (yet)

- **`declarativeNetRequest` (most ad blockers).** Electron does not implement it, so blockers such as uBlock Origin Lite install but do not block. Drift's own ad blocker is planned for v0.3.
- **`chrome.tabs` events and other browser-UI APIs.** Some extension background workers throw errors such as "Cannot read properties of undefined (reading 'onRemoved')".
- **Popups** open in a small window under the toolbar and can only use the APIs above.
- Private windows use no extensions.

## Why not the full implementation?

The library that fills these gaps, `electron-chrome-extensions`, is licensed GPL-3.0 (or a paid licence). Linking it would make Drift GPL-3.0 instead of MIT. That is a licence decision for the project owner, so Drift currently uses only MIT-compatible code (`electron-chrome-web-store` + Electron itself).

## Safety

Installing from `drift://extensions` is a direct action by the user. Installing through the Web Store page asks for confirmation and lists the extension's permissions first. Extensions can read and change the pages you visit; install only what you trust.
