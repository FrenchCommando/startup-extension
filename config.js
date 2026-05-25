// Default used only when the user has not saved a URL via the Options page.
// The live value lives in chrome.storage.local, set by options.html / options.js.
var DEFAULT_STARTUP_URL = "https://frenchcommando.com/";

async function getStartupUrl() {
  const { startupUrl } = await chrome.storage.local.get("startupUrl");
  return startupUrl || DEFAULT_STARTUP_URL;
}
