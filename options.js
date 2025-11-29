// Load saved model
document.addEventListener('DOMContentLoaded', async () => {
  const model = await chrome.storage.sync.get(['MODEL']);
  document.getElementById('model').value = model.MODEL || 'llama3.1:8b';

  // Save on click
  document.getElementById('save').onclick = async () => {
    const selectedModel = document.getElementById('model').value;
    await chrome.storage.sync.set({ MODEL: selectedModel });
    document.getElementById('status').textContent = 'Model saved!';
    setTimeout(() => document.getElementById('status').textContent = '', 2000);
  };
});