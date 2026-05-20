const urlInput = document.getElementById('url');
const saveBtn = document.getElementById('save');
const status = document.getElementById('status');
const versionEl = document.getElementById('version');

versionEl.textContent = 'v' + chrome.runtime.getManifest().version;

chrome.storage.local.get('startupUrl').then(({ startupUrl }) => {
  if (startupUrl) urlInput.value = startupUrl;
});

saveBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) return;
  await chrome.storage.local.set({ startupUrl: url });
  status.textContent = 'Saved.';
  status.classList.add('success');
  setTimeout(() => {
    status.textContent = '';
    status.classList.remove('success');
  }, 2500);
});
