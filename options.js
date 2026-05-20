const urlInput = document.getElementById('url');
const saveBtn = document.getElementById('save');
const status = document.getElementById('status');

chrome.storage.local.get('startupUrl').then(({ startupUrl }) => {
  if (startupUrl) urlInput.value = startupUrl;
});

saveBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) return;
  await chrome.storage.local.set({ startupUrl: url });
  status.textContent = 'Saved.';
  setTimeout(() => { status.textContent = ''; }, 2500);
});
