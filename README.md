# <img src="icons/icon128.png" width="32" valign="bottom" alt=""> Startup Page

A minimal Chrome extension that opens a URL of your choice when Chrome starts, and replaces the new-tab page with a redirect to the same URL.

No build step. No dependencies. ~80 lines of code total. Manifest V3.

## Install

1. **Download the latest release zip** from the [Releases page](https://github.com/FrenchCommando/startup-extension/releases).
2. **Extract it to a permanent folder** (see warning below).
3. Open `chrome://extensions` in Chrome.
4. Toggle **Developer mode** on (top right).
5. Click **Load unpacked** and select the extracted folder.
6. Right-click the extension on `chrome://extensions` → **Options**. Set your URL. Click **Save**.
7. Restart Chrome to verify the startup tab. Open a new tab to verify the new-tab override.

### Choose the extraction folder carefully

Chrome **does not copy** unpacked extensions into its own storage. It just remembers the absolute path to your folder and reads from it every time. If the folder moves, gets renamed, or is deleted, the extension breaks.

**Don't extract into:**
- `Downloads\` — you'll eventually clean it out and break the extension
- Any temp folder
- A network drive that isn't always mounted
- The release zip itself (Windows lets you "browse" a zip; that's not extracting)

**Good locations:**
- Windows: `C:\Users\<you>\Documents\ChromeExtensions\startup-extension\`
- macOS: `~/Library/Application Support/ChromeExtensions/startup-extension/`
- Linux: `~/.local/share/chrome-extensions/startup-extension/`

Your saved URL is stored separately by Chrome (in its own profile dir, keyed by extension ID), so it survives even if you delete and re-extract the folder — as long as you `Load unpacked` from the same path.

## Update

1. Download the new release zip.
2. Replace the contents of your existing extension folder with the new contents. **Keep the folder at the same path** so Chrome's extension ID stays stable and your saved URL persists.
3. On `chrome://extensions`, click the **reload** icon on the extension card.

## What this doesn't do (honest limitations)

- **Doesn't sync the URL across your machines.** Each install has its own local storage. Set the URL on each machine separately. (Cross-device sync would require publishing to the Chrome Web Store; see below.)
- **Doesn't work on mobile Chrome.** Chrome on Android/iOS does not support extensions at all — this is a Google limitation, nothing to do with this code.
- **Chrome may show a "Disable developer mode extensions" prompt** on launch. This is Chrome's safety nag for unpacked installs. Dismiss it; it's harmless.
- **You cannot install this from a `.crx` file.** Chrome blocks self-hosted `.crx` installs on stable channel. Unpacked is the only path for self-distributed extensions.

## Files

- `manifest.json` — MV3 manifest. Declares the service worker, new-tab override, options page, and `storage` permission.
- `background.js` — service worker; opens the saved URL on `chrome.runtime.onStartup`.
- `newtab.html` / `newtab.js` — new-tab override; redirects to the saved URL.
- `options.html` / `options.js` — settings UI; reads/writes `chrome.storage.local`.
- `config.js` — `DEFAULT_STARTUP_URL` + shared `getStartupUrl()` helper used by background and newtab.
- `icons/` — extension icons (16/32/48/128 px PNGs).

## Develop

Clone and `Load unpacked` directly from the clone:

```
git clone https://github.com/FrenchCommando/startup-extension.git
```

Then on `chrome://extensions` → Developer mode → Load unpacked → pick the cloned folder. Edit any file and hit **reload** on the extension card. New-tab override picks up changes immediately; the service worker may need its **service worker** link clicked on the extension card to fully restart.

## License

MIT.
