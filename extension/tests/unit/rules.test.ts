import { describe, expect, it } from 'vitest';
import { ALL_RESOURCE_TYPES, blockedPagePath, buildRuleset, rulesetId } from '../../src/lib/rules';

const domains = ['a.test', 'b.test', 'c.test', 'd.test', 'e.test'];

describe('buildRuleset — plain mode', () => {
  const rules = buildRuleset('adult', domains, 'block', 2);
  it('packs domains into rules of the given size', () => {
    expect(rules.map((r) => r.condition.requestDomains)).toEqual([
      ['a.test', 'b.test'], ['c.test', 'd.test'], ['e.test'],
    ]);
  });
  it('blocks every request type, including the page itself', () => {
    for (const r of rules) {
      expect(r.action.type).toBe('block');
      expect(r.condition.resourceTypes).toEqual(ALL_RESOURCE_TYPES);
      expect(r.condition.resourceTypes).toContain('main_frame');
    }
  });
  it('gives unique ids starting at 1', () => {
    expect(rules.map((r) => r.id)).toEqual([1, 2, 3]);
  });
});

describe('buildRuleset — friendly mode', () => {
  const rules = buildRuleset('gambling', domains, 'page', 5);
  it('adds only a higher-priority rule that sends the page to the block page', () => {
    expect(rules).toHaveLength(1);
    const [redirect] = rules;
    expect(redirect.priority).toBe(2);
    expect(buildRuleset('gambling', domains, 'block', 5)[0].priority).toBe(1);
    expect(redirect.action.type).toBe('redirect');
    expect(redirect.action.redirect?.extensionPath).toBe('/blocked.html?c=gambling');
    expect(redirect.condition.resourceTypes).toEqual(['main_frame']);
    expect(redirect.condition.requestDomains).toEqual(domains);
  });
});

describe('buildRuleset — guards', () => {
  it('returns no rules for an empty list', () => {
    expect(buildRuleset('adult', [], 'block')).toEqual([]);
  });
  it('rejects unsafe category ids', () => {
    expect(() => buildRuleset('../x', domains, 'block')).toThrow();
  });
  it('rejects a zero chunk size', () => {
    expect(() => buildRuleset('adult', domains, 'block', 0)).toThrow();
  });
});

describe('names', () => {
  it('builds ruleset ids and block page paths', () => {
    expect(rulesetId('adult', 'page')).toBe('adult-page');
    expect(blockedPagePath('adult')).toBe('/blocked.html?c=adult');
  });
});
