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
  it('sends the page to the block page and blocks everything else', () => {
    expect(rules).toHaveLength(2);
    const [redirect, block] = rules;
    expect(redirect.action.type).toBe('redirect');
    expect(redirect.action.redirect?.extensionPath).toBe('/blocked.html?c=gambling');
    expect(redirect.condition.resourceTypes).toEqual(['main_frame']);
    expect(block.action.type).toBe('block');
    expect(block.condition.resourceTypes).not.toContain('main_frame');
    expect(block.condition.resourceTypes).toHaveLength(ALL_RESOURCE_TYPES.length - 1);
  });
  it('covers the same domains in both rules', () => {
    expect(rules[0].condition.requestDomains).toEqual(rules[1].condition.requestDomains);
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
