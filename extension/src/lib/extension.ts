// Chrome-facing helpers shared by the background worker, popup and settings page.
// Everything is stored in chrome.storage.local only. Nothing leaves the device.

import categoryData from '../../../packages/blocklists/categories.json';
import {
  computeRulesetChanges,
  mergeSettings,
  protectionState,
  type Category,
  type ProtectionState,
  type Settings,
} from './policy';

export const CATEGORIES: Category[] = categoryData.categories;
export const ALL_SITES = { origins: ['<all_urls>'] };

const SETTINGS_KEY = 'settings';
const STATUS_KEY = 'status';

export interface Status {
  state: ProtectionState;
  enabledRulesets: string[];
  checkedAt: number;
  error?: string;
}

export async function getSettings(): Promise<Settings> {
  const saved = await chrome.storage.local.get(SETTINGS_KEY);
  return mergeSettings(CATEGORIES, saved[SETTINGS_KEY]);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

export async function getStatus(): Promise<Status | undefined> {
  const saved = await chrome.storage.local.get(STATUS_KEY);
  return saved[STATUS_KEY] as Status | undefined;
}

export function hasHostAccess(): Promise<boolean> {
  return chrome.permissions.contains(ALL_SITES);
}

export function isSettingsChange(changes: Record<string, unknown>): boolean {
  return SETTINGS_KEY in changes;
}

/** Make Chrome's enabled rulesets match the settings, then record the result. */
export async function applyPolicy(): Promise<Status> {
  let status: Status;
  try {
    const settings = await getSettings();
    const host = await hasHostAccess();
    const changes = computeRulesetChanges(CATEGORIES, settings, host);
    // One call: Chrome swaps the rulesets together, so there is no unprotected gap.
    await chrome.declarativeNetRequest.updateEnabledRulesets(changes);
    const enabled = await chrome.declarativeNetRequest.getEnabledRulesets();
    status = {
      state: protectionState(CATEGORIES, settings, enabled, host),
      enabledRulesets: enabled,
      checkedAt: Date.now(),
    };
  } catch (err) {
    status = {
      state: 'error',
      enabledRulesets: [],
      checkedAt: Date.now(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
  await chrome.storage.local.set({ [STATUS_KEY]: status });
  await showBadge(status.state);
  return status;
}

async function showBadge(state: ProtectionState): Promise<void> {
  const look: Record<ProtectionState, { text: string; color: string; title: string }> = {
    on: { text: '', color: '#166534', title: 'Lumio Guard: protection is on' },
    partial: { text: '!', color: '#B45309', title: 'Lumio Guard: some protection is off' },
    off: { text: 'OFF', color: '#991B1B', title: 'Lumio Guard: protection is off' },
    error: { text: '!', color: '#991B1B', title: 'Lumio Guard: protection needs attention' },
  };
  const l = look[state];
  await chrome.action.setBadgeText({ text: l.text });
  await chrome.action.setBadgeBackgroundColor({ color: l.color });
  await chrome.action.setTitle({ title: l.title });
}

export function categoryLabel(id: string | null): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? 'restricted';
}
