# Project: startup-extension

Tiny Manifest V3 Chrome extension distributed via GitHub Releases (not the Chrome Web Store). Does one thing: override the new-tab page to redirect to a configurable URL. When Chrome's startup mode is "Open the New Tab page", the launch tab routes through that override — so the extension effectively controls what shows on launch under that mode (Chrome surfaces this as *"Startup Page is controlling this setting"* on `chrome://settings/onStartup`). Under other startup modes, the override only fires on Ctrl+T. There is no separate `onStartup` code path inside the extension; the launch-tab behavior is entirely a side effect of the new-tab override + Chrome's startup-mode resolution. URL is user-configurable via an Options page and stored in `chrome.storage.local`.

## Architecture

No build step, no dependencies. Files:

- `manifest.json` — MV3. Declares the service worker, `newtab` override, `options_ui` (open in tab), the toolbar `action` (no popup, click handler opens Options), `icons`, and the `storage` permission.
- `background.js` — listens for `chrome.action.onClicked` and opens the Options page via `chrome.runtime.openOptionsPage()`. The action handler is what keeps the toolbar icon colored — without it, Chrome greys out unpinned/no-action extensions. There is intentionally no `chrome.runtime.onStartup` handler: with Chrome's "Open the New Tab page" startup mode, Chrome already opens a new tab on launch, which the `newtab` override redirects to the saved URL. Adding an `onStartup` `chrome.tabs.create` would duplicate that and produce two tabs. Users on "Continue where you left off" or "Open a specific page" startup modes will not get the URL on launch — only via Ctrl+T.
- `newtab.html` / `newtab.js` — loads `config.js`, then `window.location.replace(await getStartupUrl())`.
- `options.html` / `options.js` — input + Save button. Reads/writes `chrome.storage.local` key `startupUrl`.
- `config.js` — defines `DEFAULT_STARTUP_URL` and `async function getStartupUrl()`. Loaded by `newtab.html` (via `<script src>`). The service worker no longer loads it (the `onStartup` handler was removed), and `options.js` reads `chrome.storage.local` directly — so config.js is currently single-consumer. The form (`var` + top-level `async function`) is kept dual-compatible with service-worker `importScripts` in case a service-worker consumer is reintroduced.

## Distribution model

Self-hosted via GitHub Releases. Users download the release zip, extract, and `Load unpacked`. Not published to the Chrome Web Store.

This shapes several design choices:

- **`chrome.storage.local`, not `.sync`.** Each unpacked install gets its own extension ID per machine, so `chrome.storage.sync` would store data but never actually sync anything between machines. Using `.local` is honest about the behavior. If we ever publish to the Web Store, switching back to `.sync` is a one-line change (`config.js` + `options.js`).
- **No `.crx` distribution.** Chrome blocks self-hosted `.crx` installs on stable channel. The only viable user path is "download zip, extract, Load unpacked." The README's install section is structured around that flow and warns about the permanent-folder pitfall (Chrome reads code live from the user's folder; if they move/delete it, the extension breaks).

## Source-of-truth

- The live URL lives in `chrome.storage.local` under key `startupUrl`.
- `DEFAULT_STARTUP_URL` in `config.js` is only the fallback for fresh installs before the user saves anything. Don't treat it as the configured value.

## Conventions

- Stay dependency-free and build-free. The whole point is `Load unpacked` just works.
- `config.js` uses `var` and a top-level `async function` on purpose — both forms work in a service-worker `importScripts` context and in an HTML `<script src>` context. Only the HTML path is currently exercised, but keep it dual-compatible: a future service-worker consumer (e.g. re-adding an `onStartup` handler) should not need to refactor `config.js`. Don't change to `const`/`export` without testing both paths.
- All user-tunable config goes through `chrome.storage.local` + the Options page. Do not add new hardcoded URLs in `background.js` or `newtab.html`.
- Keep HTML and JS in separate files (per repo style), even when the JS is one line.

## Releasing

GitHub Actions workflow at `.github/workflows/release.yml` triggers on tag pushes matching `v*`. It zips the extension and publishes a GitHub Release with the zip attached.

### What triggers the workflow

**Only pushing a `v*` tag.** Specifically:

- `git tag v0.4.0` alone does nothing on GitHub — tags are local until pushed.
- `git push` (commits) does NOT trigger the release workflow. This is intentional: every commit shouldn't ship a release.
- `git push --tags` (or `git push origin v0.4.0`) is what actually fires it.

### Process

1. Bump `version` in `manifest.json` to the new value (e.g. `0.4.0`).
2. Commit the bump: `git commit -am "Bump to 0.4.0"`.
3. Push the commit: `git push`. (Workflow does not fire yet.)
4. Tag: `git tag v0.4.0` (leading `v` is convention; the manifest field has no `v`).
5. Push the tag: `git push --tags`. (Workflow fires now.)
6. Wait for the workflow to finish; the release appears under Releases with the zip attached.

### Workflow details

The workflow excludes `.git/`, `.github/`, `BRAINSTORM.md`, and `CLAUDE.md` from the zip. `README.md` is included so users have docs alongside the extracted folder. The manifest version is NOT auto-set from the tag — keep tag and manifest in sync by hand. If they drift, the zip will ship with whatever's in the committed `manifest.json` (the tag controls the release name and the zip filename, not the manifest version inside).

## Testing

Manual only — no test framework, and there shouldn't be one for something this small.

- Reload the extension on `chrome://extensions` after any edit. The Options page and new-tab override pick up changes on reload; the service worker may need a "service worker" restart link click on the extension card.
- New-tab override: open a new tab. A brief "Redirecting…" title flash is expected (async storage read before redirect).
- Launch behavior: only fires with Chrome's startup mode set to "Open the New Tab page". Requires a full Chrome restart (close all windows). Under that mode, Chrome routes the launch tab through the new-tab override — there's no separate `onStartup` listener inside the extension, but Chrome (correctly) attributes control of the launch page to the extension.
