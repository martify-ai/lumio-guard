// Friendly block page. It never shows the blocked address or any of its content.
import { categoryLabel } from './lib/extension';

const category = new URLSearchParams(location.search).get('c');
document.getElementById('category')!.textContent = categoryLabel(category);

document.getElementById('back')!.addEventListener('click', () => {
  if (history.length > 1) history.back();
  else void chrome.tabs.update({ url: 'chrome://newtab/' });
});

document.getElementById('new-tab')!.addEventListener('click', () => {
  void chrome.tabs.update({ url: 'chrome://newtab/' });
});
