import {
  ALL_SITES,
  CATEGORIES,
  getSettings,
  hasHostAccess,
  saveSettings,
  type Status,
} from './lib/extension';
import { thresholdsValid } from './lib/wellbeing';

const STATUS_TEXT: Record<Status['state'], string> = {
  on: 'Protection is on: every group is blocked and Safe Search is on.',
  partial: 'Protection is partly on. Something is switched off above.',
  off: 'Protection is off. Tick at least one box above to turn it on.',
  error: 'Lumio Guard could not switch on its rules, so protection may not be working. Close Chrome completely and open it again. If you still see this, remove Lumio Guard and install it again.',
};

const TIME_IDS = ['t0', 't1', 't2'];

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

async function refreshStatus(): Promise<void> {
  const status = (await chrome.runtime.sendMessage({ type: 'refresh-status' })) as Status;
  el('status').textContent = STATUS_TEXT[status.state];
  // Shown only when something went wrong, to help whoever is fixing it.
  el('status-detail').textContent =
    status.state === 'error' && status.error ? `Technical detail: ${status.error}` : '';
}

async function renderCategories(): Promise<void> {
  const settings = await getSettings();
  const box = el('categories');
  box.replaceChildren(
    ...CATEGORIES.map((c) => {
      const label = document.createElement('label');
      label.className = 'toggle';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = `cat-${c.id}`;
      input.checked = settings.categories[c.id];
      input.addEventListener('change', async () => {
        const s = await getSettings();
        s.categories[c.id] = input.checked;
        await saveSettings(s);
        await refreshStatus();
      });
      const text = document.createElement('span');
      const name = document.createElement('strong');
      name.textContent = c.label;
      const desc = document.createElement('span');
      desc.textContent = c.description;
      text.append(name, desc);
      label.append(input, text);
      return label;
    }),
  );
}

async function renderFriendly(): Promise<void> {
  const settings = await getSettings();
  const host = await hasHostAccess();
  const box = el<HTMLInputElement>('friendly');
  const note = el('friendly-note');
  box.checked = settings.friendlyPage && host;
  note.hidden = !(settings.friendlyPage && !host);
  note.textContent = 'Chrome has not given access to all websites, so Chrome\'s own "blocked" page is shown.';
}

el<HTMLInputElement>('friendly').addEventListener('change', async (e) => {
  const box = e.target as HTMLInputElement;
  const s = await getSettings();
  if (box.checked) {
    // Must run inside the click so Chrome shows its permission prompt.
    const granted = await chrome.permissions.request(ALL_SITES);
    s.friendlyPage = granted;
  } else {
    s.friendlyPage = false;
    await chrome.permissions.remove(ALL_SITES).catch(() => false);
  }
  await saveSettings(s);
  await renderFriendly();
  await refreshStatus();
});

el<HTMLInputElement>('safesearch').addEventListener('change', async (e) => {
  const s = await getSettings();
  s.safeSearch = (e.target as HTMLInputElement).checked;
  await saveSettings(s);
  await refreshStatus();
});

void getSettings().then((s) => {
  el<HTMLInputElement>('safesearch').checked = s.safeSearch;
  el<HTMLInputElement>('wellbeing').checked = s.wellbeing.enabled;
  TIME_IDS.forEach((id, i) => {
    el<HTMLInputElement>(id).value = String(s.wellbeing.thresholds[i] ?? '');
  });
});

el<HTMLInputElement>('wellbeing').addEventListener('change', async (e) => {
  const s = await getSettings();
  s.wellbeing.enabled = (e.target as HTMLInputElement).checked;
  await saveSettings(s);
});

for (const id of TIME_IDS) {
  el<HTMLInputElement>(id).addEventListener('change', async () => {
    const values = TIME_IDS.map((t) => Number(el<HTMLInputElement>(t).value));
    const note = el('times-note');
    if (!thresholdsValid(values)) {
      note.textContent = 'Not saved. Use whole minutes from 1 to 600, each one bigger than the one before.';
      return;
    }
    const s = await getSettings();
    s.wellbeing.thresholds = values;
    await saveSettings(s);
    note.textContent = 'Saved.';
  });
}
void renderCategories();
void renderFriendly();
void refreshStatus();
