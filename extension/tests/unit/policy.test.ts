import { describe, expect, it } from 'vitest';
import {
  activeMode,
  computeRulesetChanges,
  defaultSettings,
  mergeSettings,
  protectionState,
  type Category,
} from '../../src/lib/policy';

const cats: Category[] = [
  { id: 'adult', label: 'Adult content', description: '', defaultOn: true },
  { id: 'gambling', label: 'Betting', description: '', defaultOn: true },
];

describe('settings', () => {
  it('defaults: every launch category on, Safe Search on, plain block page', () => {
    expect(defaultSettings(cats)).toEqual({
      categories: { adult: true, gambling: true },
      friendlyPage: false,
      safeSearch: true,
    });
  });
  it('keeps saved values and fills new settings with defaults', () => {
    expect(mergeSettings(cats, { categories: { adult: false }, friendlyPage: true })).toEqual({
      categories: { adult: false, gambling: true },
      friendlyPage: true,
      safeSearch: true,
    });
    expect(mergeSettings(cats, { safeSearch: false }).safeSearch).toBe(false);
  });
  it('ignores junk and unknown categories', () => {
    expect(
      mergeSettings(cats, { categories: { adult: 'no', evil: true }, friendlyPage: 1, safeSearch: 'off' }),
    ).toEqual(defaultSettings(cats));
    expect(mergeSettings(cats, null)).toEqual(defaultSettings(cats));
  });
});

describe('activeMode', () => {
  const s = { ...defaultSettings(cats), friendlyPage: true };
  it('uses the friendly page only with host access', () => {
    expect(activeMode(s, true)).toBe('page');
    expect(activeMode(s, false)).toBe('block');
    expect(activeMode(defaultSettings(cats), true)).toBe('block');
  });
});

describe('computeRulesetChanges', () => {
  it('enables plain rules for on categories and disables the rest', () => {
    const s = { categories: { adult: true, gambling: false }, friendlyPage: false, safeSearch: true };
    expect(computeRulesetChanges(cats, s, false)).toEqual({
      enableRulesetIds: ['adult-block', 'safesearch'],
      disableRulesetIds: ['adult-page', 'gambling-block', 'gambling-page'],
    });
  });
  it('swaps to friendly rules when allowed', () => {
    const s = { categories: { adult: true, gambling: true }, friendlyPage: true, safeSearch: true };
    expect(computeRulesetChanges(cats, s, true)).toEqual({
      enableRulesetIds: ['adult-page', 'gambling-page', 'safesearch'],
      disableRulesetIds: ['adult-block', 'gambling-block'],
    });
  });
  it('turns Safe Search off on its own, leaving blocking on', () => {
    const s = { ...defaultSettings(cats), safeSearch: false };
    expect(computeRulesetChanges(cats, s, false)).toEqual({
      enableRulesetIds: ['adult-block', 'gambling-block'],
      disableRulesetIds: ['adult-page', 'gambling-page', 'safesearch'],
    });
  });
  it('never enables both modes for one category', () => {
    for (const host of [true, false]) {
      for (const friendlyPage of [true, false]) {
        const { enableRulesetIds } = computeRulesetChanges(cats, { ...defaultSettings(cats), friendlyPage }, host);
        expect(enableRulesetIds.filter((id) => id !== 'safesearch')).toHaveLength(2);
      }
    }
  });
});

describe('protectionState', () => {
  const all = defaultSettings(cats);
  const allOn = ['adult-block', 'gambling-block', 'safesearch'];
  it('is on when every expected ruleset is enabled', () => {
    expect(protectionState(cats, all, allOn, false)).toBe('on');
  });
  it('is an error when Chrome did not enable an expected ruleset', () => {
    expect(protectionState(cats, all, ['adult-block', 'safesearch'], false)).toBe('error');
    expect(protectionState(cats, all, ['adult-block', 'gambling-block'], false)).toBe('error');
  });
  it('is partial when a group or Safe Search is off', () => {
    expect(
      protectionState(cats, { ...all, categories: { adult: true, gambling: false } }, ['adult-block', 'safesearch'], false),
    ).toBe('partial');
    expect(protectionState(cats, { ...all, safeSearch: false }, ['adult-block', 'gambling-block'], false)).toBe('partial');
    expect(
      protectionState(cats, { ...all, categories: { adult: false, gambling: false } }, ['safesearch'], false),
    ).toBe('partial');
  });
  it('is off only when everything is off', () => {
    expect(
      protectionState(cats, { categories: { adult: false, gambling: false }, friendlyPage: false, safeSearch: false }, [], false),
    ).toBe('off');
  });
});
