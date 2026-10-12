# Roadmap

Drift stays small on purpose. Each version adds one theme of features; none should make startup or idle memory noticeably worse.

## v0.1 – first release

Tabs, address bar and suggestions, new tab page, bookmarks, history, downloads, private windows, find in page, zoom, settings, keyboard shortcuts, session restore, tab discarding, `drift://` pages, optional Google / Microsoft sign-in, installer + portable build, auto-update.

## v0.2 – daily-driver basics (current)

- **Password manager** – save / update prompt, autofill, encrypted storage, `drift://passwords`
- **Extensions (basic)** – Chrome Web Store install, toolbar icons, `drift://extensions`
- **Split view**, tab menu (mute, duplicate, close others), reorganised main menu
- Animated startup screen, "What's new" window and in-app "restart to update" after each release

## v0.3 – cleaner pages, better tab management

- **Ad blocker** – network-level blocking with a bundled filter list, per-site toggle, blocked-count badge (Electron has no `declarativeNetRequest`, so this is built in, not an extension)
- **Vertical tabs** – optional sidebar tab list, collapsible, pinned tabs on top
- **Extensions, full API** – popups and `chrome.tabs` events (needs a licence decision, see docs/EXTENSIONS.md)

## v0.4 – organise and read

- **Spaces** – named groups of tabs (work, study, personal) with their own session and optional separate cookie storage
- **Reader mode** – distraction-free article view with font size, theme and RTL-aware layout

## v0.5 – built-in assistant

- **AI side panel** – summarise the current page and translate selected text or the whole page, Arabic ⇄ English first. Bring-your-own API key; nothing is sent unless the user triggers it.

## v0.6 – everywhere you browse

- **Sync across devices** – bookmarks, history, settings, passwords and open tabs, end-to-end encrypted

## Also on the list

- Code-signed Windows builds and notarised macOS builds
- Per-site permissions UI (camera, microphone, location, notifications)
- PDF viewer controls, print preview, tab search
- Linux builds (AppImage / deb)

Ideas and votes are welcome in [GitHub Issues](https://github.com/l7v0l/drift-browser/issues).
