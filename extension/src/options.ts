import {
  ALL_SITES,
  CATEGORIES,
  getSettings,
  hasHostAccess,
  saveSettings,
  type Status,
} from './lib/extension';

const STATUS_TEXT: Record<Status['state'], string> = {
  on: 'Protection is on for every group.',
  partial: 'Protection is on for some groups. The others are switched off above.',
  off: 'Protection is off. Tick at least one group above to turn it on.',
  error: 'Lumio Guard could not switch on its rules. Try restarting Chrome.',
};

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

async function refreshStatus(): Promise<void> {
  const status = (await chrome.runtime.sendMessage({ type: 'refresh-status' })) as Status;
  el('status').textContent = STATUS_TEXT[status.state];
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

void renderCategories();
void renderFriendly();
void refreshStatus();
