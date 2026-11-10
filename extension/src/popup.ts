import { CATEGORIES, getSettings, type Status } from './lib/extension';
import { COVERED_ENGINES } from './lib/safesearch';
import type { ProtectionState } from './lib/policy';
import { todayTotals, wholeMinutes, type WellbeingState } from './lib/wellbeing';

const COPY: Record<ProtectionState, { pill: string; headline: string; detail: string }> = {
  on: { pill: 'On', headline: 'Protection is on', detail: 'Known harmful sites are blocked in this browser.' },
  partial: { pill: 'Partly on', headline: 'Some protection is off', detail: 'Something is switched off in Settings.' },
  off: { pill: 'Off', headline: 'Protection is off', detail: 'Everything is switched off. Turn it on in Settings.' },
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

  const row = (label: string, on: boolean, onText: string, offText: string, id?: string) => {
    const li = document.createElement('li');
    if (id) li.id = id;
    const name = document.createElement('span');
    name.textContent = label;
    const state = document.createElement('span');
    state.textContent = on ? onText : offText;
    state.className = `pill ${on ? 'on' : 'off'}`;
    li.append(name, state);
    return li;
  };
  el<HTMLUListElement>('categories').replaceChildren(
    ...CATEGORIES.map((c) => row(c.label, settings.categories[c.id], 'Blocked', 'Not blocked')),
    row(`Safe Search (${COVERED_ENGINES.join(', ')})`, settings.safeSearch, 'On', 'Off', 'safesearch-row'),
  );

  el('incognito').hidden = await chrome.extension.isAllowedIncognitoAccess();

  const wb = (await chrome.runtime.sendMessage({ type: 'wellbeing-refresh' })) as WellbeingState;
  const now = Date.now();
  el('time').textContent =
    `Browsing time: ${wholeMinutes(wb.sessionMs)} min this session, ` +
    `${wholeMinutes(todayTotals(wb, now).activeMs)} min today.`;
}

el('open-settings').addEventListener('click', () => chrome.runtime.openOptionsPage());
void render();
