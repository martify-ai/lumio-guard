// Decides which rulesets should be on, from the user's settings.
// Pure functions only, so they are easy to test.

import { rulesetId, type Mode } from './rules';
import { SAFESEARCH_RULESET_ID } from './safesearch';
import { cleanThresholds, DEFAULT_THRESHOLDS } from './wellbeing';

export interface Category {
  id: string;
  label: string;
  description: string;
  defaultOn: boolean;
}

export interface Settings {
  /** category id → on/off */
  categories: Record<string, boolean>;
  /** user asked for the friendly Lumio block page */
  friendlyPage: boolean;
  /** force safe modes on supported search engines and YouTube */
  safeSearch: boolean;
  /** break reminders: on/off and the minutes at which they appear */
  wellbeing: { enabled: boolean; thresholds: number[] };
}

export function defaultSettings(categories: Category[]): Settings {
  return {
    categories: Object.fromEntries(categories.map((c) => [c.id, c.defaultOn])),
    friendlyPage: false,
    safeSearch: true,
    wellbeing: { enabled: true, thresholds: [...DEFAULT_THRESHOLDS] },
  };
}

/** Fill gaps (new categories, missing fields) with defaults. Unknown ids are dropped. */
export function mergeSettings(categories: Category[], saved: unknown): Settings {
  const base = defaultSettings(categories);
  if (!saved || typeof saved !== 'object') return base;
  const s = saved as Partial<Settings>;
  for (const c of categories) {
    const v = s.categories?.[c.id];
    if (typeof v === 'boolean') base.categories[c.id] = v;
  }
  if (typeof s.friendlyPage === 'boolean') base.friendlyPage = s.friendlyPage;
  if (typeof s.safeSearch === 'boolean') base.safeSearch = s.safeSearch;
  if (s.wellbeing && typeof s.wellbeing === 'object') {
    if (typeof s.wellbeing.enabled === 'boolean') base.wellbeing.enabled = s.wellbeing.enabled;
    base.wellbeing.thresholds = cleanThresholds(s.wellbeing.thresholds);
  }
  return base;
}

/** Friendly mode only counts when the user wants it AND Chrome granted host access. */
export function activeMode(settings: Settings, hasHostAccess: boolean): Mode {
  return settings.friendlyPage && hasHostAccess ? 'page' : 'block';
}

export interface RulesetChanges {
  enableRulesetIds: string[];
  disableRulesetIds: string[];
}

export function computeRulesetChanges(
  categories: Category[],
  settings: Settings,
  hasHostAccess: boolean,
): RulesetChanges {
  const mode = activeMode(settings, hasHostAccess);
  const enable: string[] = [];
  const disable: string[] = [];
  for (const c of categories) {
    const on = settings.categories[c.id] === true;
    (on ? enable : disable).push(rulesetId(c.id, 'block'));
    (on && mode === 'page' ? enable : disable).push(rulesetId(c.id, 'page'));
  }
  (settings.safeSearch ? enable : disable).push(SAFESEARCH_RULESET_ID);
  return { enableRulesetIds: enable, disableRulesetIds: disable };
}

export type ProtectionState = 'on' | 'partial' | 'off' | 'error';

export function protectionState(
  categories: Category[],
  settings: Settings,
  enabledRulesets: string[],
  hasHostAccess: boolean,
): ProtectionState {
  const expected = computeRulesetChanges(categories, settings, hasHostAccess).enableRulesetIds;
  if (!expected.every((id) => enabledRulesets.includes(id))) return 'error';
  const onCount = categories.filter((c) => settings.categories[c.id]).length;
  if (onCount === 0 && !settings.safeSearch) return 'off';
  return onCount === categories.length && settings.safeSearch ? 'on' : 'partial';
}
