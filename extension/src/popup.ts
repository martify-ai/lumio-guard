import { CATEGORIES, getSettings, type Status } from './lib/extension';
import type { ProtectionState } from './lib/policy';

const COPY: Record<ProtectionState, { pill: string; headline: string; detail: string }> = {
  on: { pill: 'On', headline: 'Protection is on', detail: 'Known harmful sites are blocked in this browser.' },
  partial: { pill: 'Partly on', headline: 'Some protection is off', detail: 'One or more groups are switched off in Settings.' },
  off: { pill: 'Off', headline: 'Protection is off', detail: 'All groups are switched off. Turn them on in Settings.' },
  error: { pill: 'Check', headline: 'Protection needs attention', detail: 'Lumio Guard could not switch on its rules. Try restarting Chrome. If this keeps happening, reinstall the extension.' },
};

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

async function render(): Promise<void> {
  const status = (await chrome.runtime.sendMessage({ type: 'refresh-status' })) as Status;
  const settings = await getSettings();
  const copy = COPY[status.state];

  const pill = el('state');
  pill.textContent = copy.pill;
  pill.className = `pill ${status.state}`;
  el('headline').textContent = copy.headline;
  el('detail').textContent = copy.detail;

  const list = el<HTMLUListElement>('categories');
  list.replaceChildren(
    ...CATEGORIES.map((c) => {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = c.label;
      const state = document.createElement('span');
      const on = settings.categories[c.id];
      state.textContent = on ? 'Blocked' : 'Not blocked';
      state.className = `pill ${on ? 'on' : 'off'}`;
      li.append(name, state);
      return li;
    }),
  );

  el('incognito').hidden = await chrome.extension.isAllowedIncognitoAccess();
}

el('open-settings').addEventListener('click', () => chrome.runtime.openOptionsPage());
void render();
