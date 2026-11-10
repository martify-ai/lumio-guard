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
  it('defaults every launch category to on, plain block page', () => {
    expect(defaultSettings(cats)).toEqual({
      categories: { adult: true, gambling: true },
      friendlyPage: false,
    });
  });
  it('keeps saved values and fills new categories with defaults', () => {
    expect(mergeSettings(cats, { categories: { adult: false }, friendlyPage: true })).toEqual({
      categories: { adult: false, gambling: true },
      friendlyPage: true,
    });
  });
  it('ignores junk and unknown categories', () => {
    expect(mergeSettings(cats, { categories: { adult: 'no', evil: true }, friendlyPage: 1 })).toEqual(
      defaultSettings(cats),
    );
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
    const s = { categories: { adult: true, gambling: false }, friendlyPage: false };
    expect(computeRulesetChanges(cats, s, false)).toEqual({
      enableRulesetIds: ['adult-block'],
      disableRulesetIds: ['adult-page', 'gambling-block', 'gambling-page'],
    });
  });
  it('swaps to friendly rules when allowed', () => {
    const s = { categories: { adult: true, gambling: true }, friendlyPage: true };
    expect(computeRulesetChanges(cats, s, true)).toEqual({
      enableRulesetIds: ['adult-page', 'gambling-page'],
      disableRulesetIds: ['adult-block', 'gambling-block'],
    });
  });
  it('never enables both modes for one category', () => {
    for (const host of [true, false]) {
      for (const friendlyPage of [true, false]) {
        const { enableRulesetIds } = computeRulesetChanges(cats, { ...defaultSettings(cats), friendlyPage }, host);
        expect(enableRulesetIds).toHaveLength(2);
      }
    }
  });
});

describe('protectionState', () => {
  const all = defaultSettings(cats);
  it('is on when every expected ruleset is enabled', () => {
    expect(protectionState(cats, all, ['adult-block', 'gambling-block'], false)).toBe('on');
  });
  it('is an error when Chrome did not enable an expected ruleset', () => {
    expect(protectionState(cats, all, ['adult-block'], false)).toBe('error');
  });
  it('is partial or off when the user turned groups off', () => {
    expect(protectionState(cats, { ...all, categories: { adult: true, gambling: false } }, ['adult-block'], false)).toBe('partial');
    expect(protectionState(cats, { ...all, categories: { adult: false, gambling: false } }, [], false)).toBe('off');
  });
});
