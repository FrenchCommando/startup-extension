importScripts('config.js');

chrome.runtime.onStartup.addListener(async () => {
  const url = await getStartupUrl();
  chrome.tabs.create({ url });
});
