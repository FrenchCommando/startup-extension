# Project: startup-extension

Tiny Manifest V3 Chrome extension distributed via GitHub Releases (not the Chrome Web Store). Two jobs: open a URL on Chrome startup, and override the new-tab page to redirect to the same URL. URL is user-configurable via an Options page and stored in `chrome.storage.local`.

## Architecture

No build step, no dependencies. Files:

- `manifest.json` — MV3. Declares the service worker, `newtab` override, `options_ui` (open in tab), and the `storage` permission.
- `background.js` — listens for `chrome.runtime.onStartup`, awaits `getStartupUrl()`, opens it via `chrome.tabs.create`.
- `newtab.html` / `newtab.js` — loads `config.js`, then `window.location.replace(await getStartupUrl())`.
- `options.html` / `options.js` — input + Save button. Reads/writes `chrome.storage.local` key `startupUrl`.
- `config.js` — shared. Defines `DEFAULT_STARTUP_URL` and `async function getStartupUrl()`. Used by both the service worker (via `importScripts`) and the HTML pages (via `<script src>`).

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
- `config.js` uses `var` and a top-level `async function` on purpose — both forms work in a service-worker `importScripts` context and in an HTML `<script src>` context. Don't change to `const`/`export` without testing both paths.
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
- Startup behavior: requires a full Chrome restart (close all windows).
