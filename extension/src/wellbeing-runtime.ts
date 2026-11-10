// Chrome side of the wellbeing timer. Loaded by the background worker.
//
// Privacy: the timer never reads web addresses. It asks Chrome three things:
// is the computer idle, is a Chrome window in front, and is the front tab playing
// sound (so watching a video counts). Only when a reminder is due does it look at
// the front tab, and Chrome only reveals that tab's address on the few
// entertainment sites the extension has access to.

import { getSettings } from './lib/extension';
import {
  advance,
  BREAK_LABEL,
  CONTINUE_LABEL,
  initialState,
  isEntertainmentUrl,
  promptMessage,
  recordBreak,
  type WellbeingState,
} from './lib/wellbeing';

declare const LG_TEST: boolean;

const STATE_KEY = 'wellbeing';
const ALARM = 'wellbeing-tick';
const IDLE_SECONDS = 60;
const NOTIFICATION_PREFIX = 'lumio-guard-reminder-';

let activityOverride: boolean | null = null;
// Ticks arrive from several events; run them one at a time so none overwrites another.
let queue: Promise<unknown> = Promise.resolve();

export async function getWellbeingState(): Promise<WellbeingState> {
  const saved = await chrome.storage.local.get(STATE_KEY);
  return (saved[STATE_KEY] as WellbeingState | undefined) ?? initialState(Date.now());
}

async function isActiveNow(): Promise<boolean> {
  if (activityOverride !== null) return activityOverride;
  const idle = await chrome.idle.queryState(IDLE_SECONDS);
  if (idle === 'locked') return false;
  const win = await chrome.windows.getLastFocused().catch(() => null);
  if (!win?.focused) return false;
  if (idle === 'active') return true;
  // No keyboard or mouse for a while: still counts if the front tab is playing sound.
  const [tab] = await chrome.tabs.query({ active: true, windowId: win.id });
  return tab?.audible === true;
}

export function tick(): Promise<void> {
  const run = queue.then(async () => {
    const settings = await getSettings();
    const thresholds = settings.wellbeing.enabled ? settings.wellbeing.thresholds : null;
    const { state, fire } = advance(await getWellbeingState(), Date.now(), await isActiveNow(), thresholds);
    await chrome.storage.local.set({ [STATE_KEY]: state });
    if (fire !== null && thresholds) await showReminder(promptMessage(fire, thresholds), fire);
  });
  queue = run.catch(() => undefined);
  return run;
}

/** Runs inside the web page. Must not use anything from outside its own body. */
function pageReminder(message: string, breakLabel: string, continueLabel: string): void {
  const ID = 'lumio-guard-reminder';
  document.getElementById(ID)?.remove();
  const host = document.createElement('div');
  host.id = ID;
  host.style.cssText = 'all:initial;position:fixed;right:16px;bottom:16px;z-index:2147483647;';
  const root = host.attachShadow({ mode: 'open' });

  const card = document.createElement('div');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', 'Lumio Guard reminder');
  card.style.cssText =
    'box-sizing:border-box;width:320px;max-width:calc(100vw - 32px);padding:16px;background:#fff;color:#09090B;' +
    'border:1px solid #D4D4D8;border-left:4px solid #166534;border-radius:8px;' +
    'font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;';
  const brand = document.createElement('div');
  brand.textContent = 'Lumio Guard';
  brand.style.cssText = 'font-weight:800;color:#0D2137;margin-bottom:4px;';
  const text = document.createElement('p');
  text.textContent = message;
  text.style.cssText = 'margin:0 0 12px;';
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';

  const button = (label: string, primary: boolean, outcome: string) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText =
      'min-height:44px;padding:0 16px;border-radius:4px;font:inherit;font-weight:600;cursor:pointer;' +
      (primary
        ? 'background:#166534;color:#fff;border:0;'
        : 'background:transparent;color:#09090B;border:1.5px solid #A1A1AA;');
    b.addEventListener('click', () => {
      host.remove();
      void chrome.runtime.sendMessage({ type: 'reminder-outcome', outcome });
    });
    return b;
  };
  row.append(button(breakLabel, true, 'break'), button(continueLabel, false, 'continue'));
  card.append(brand, text, row);
  root.append(card);
  document.documentElement.append(host);
}

async function showReminder(message: string, threshold: number): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab?.id !== undefined && isEntertainmentUrl(tab.url)) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: pageReminder,
        args: [message, BREAK_LABEL, CONTINUE_LABEL],
      });
      return;
    } catch {
      // Page not reachable (still loading, special page): fall through to a notification.
    }
  }
  await chrome.notifications.create(`${NOTIFICATION_PREFIX}${threshold}`, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icon128.png'),
    title: 'Lumio Guard',
    message,
    buttons: [{ title: BREAK_LABEL }, { title: CONTINUE_LABEL }],
    priority: 1,
  });
}

function tookBreak(): Promise<void> {
  const run = queue.then(async () => {
    await chrome.storage.local.set({ [STATE_KEY]: recordBreak(await getWellbeingState(), Date.now()) });
  });
  queue = run.catch(() => undefined);
  return run;
}

const breakPage = () => chrome.runtime.getURL('break.html');

export function startWellbeing(): void {
  void chrome.alarms.get(ALARM).then((a) => {
    if (!a) void chrome.alarms.create(ALARM, { periodInMinutes: 1 });
  });
  chrome.idle.setDetectionInterval(IDLE_SECONDS);

  chrome.alarms.onAlarm.addListener((a) => {
    if (a.name === ALARM) void tick();
  });
  chrome.idle.onStateChanged.addListener(() => void tick());
  chrome.windows.onFocusChanged.addListener(() => void tick());

  chrome.notifications.onButtonClicked.addListener((id, button) => {
    if (!id.startsWith(NOTIFICATION_PREFIX)) return;
    chrome.notifications.clear(id);
    if (button === 0) {
      void tookBreak();
      void chrome.tabs.create({ url: breakPage() });
    }
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type === 'reminder-outcome' && sender.tab?.id !== undefined) {
      if (msg.outcome === 'break') {
        void tookBreak();
        void chrome.tabs.update(sender.tab.id, { url: breakPage() });
      }
      return false;
    }
    if (msg?.type === 'wellbeing-refresh') {
      tick().then(getWellbeingState).then(sendResponse);
      return true;
    }
    return false;
  });

  if (LG_TEST) {
    // Test builds only: lets automated tests pretend the browser is in use.
    (globalThis as Record<string, unknown>).__lgTest = {
      tick,
      setActive: (v: boolean | null) => {
        activityOverride = v;
      },
    };
  }
}
