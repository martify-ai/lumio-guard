import { describe, expect, it } from 'vitest';
import { ALL_RESOURCE_TYPES } from '../../src/lib/rules';
import { buildSafeSearchRules, safeSearchHostPermissions } from '../../src/lib/safesearch';

const google = ['google.com', 'google.com.ng', 'google.co.uk'];
const rules = buildSafeSearchRules(google);
const byId = (id: number) => rules.find((r) => r.id === id)!;
const matches = (id: number, url: string) => new RegExp(byId(id).condition.regexFilter!).test(url);
const param = (id: number) => byId(id).action.redirect!.transform!.queryTransform!.addOrReplaceParams![0];

describe('Safe Search rules', () => {
  it('has unique ids', () => {
    expect(new Set(rules.map((r) => r.id)).size).toBe(rules.length);
  });

  it('Google: forces safe=active on search pages of every listed domain', () => {
    expect(param(1)).toEqual({ key: 'safe', value: 'active' });
    expect(byId(1).condition.requestDomains).toEqual(google);
    for (const url of [
      'https://www.google.com/search?q=x',
      'https://google.com/search?q=x&safe=off',
      'https://www.google.com.ng/search?q=x&tbm=isch',
      'http://www.google.co.uk/search',
    ]) expect(matches(1, url), url).toBe(true);
    for (const url of [
      'https://www.google.com/maps/search/x',
      'https://mail.google.com/search?q=x',
      'https://www.google.com/',
    ]) expect(matches(1, url), url).toBe(false);
  });

  it('Bing: forces adlt=strict on web, image and video search', () => {
    expect(param(2)).toEqual({ key: 'adlt', value: 'strict' });
    for (const url of [
      'https://www.bing.com/search?q=x',
      'https://www.bing.com/images/search?q=x',
      'https://www.bing.com/videos/search?q=x',
    ]) expect(matches(2, url), url).toBe(true);
    expect(matches(2, 'https://www.bing.com/maps')).toBe(false);
  });

  it('DuckDuckGo: forces kp=1 on result pages', () => {
    expect(param(3)).toEqual({ key: 'kp', value: '1' });
    for (const url of [
      'https://duckduckgo.com/?q=x',
      'https://html.duckduckgo.com/html/?q=x',
      'https://lite.duckduckgo.com/lite/?q=x',
    ]) expect(matches(3, url), url).toBe(true);
    expect(matches(3, 'https://duckduckgo.com/about')).toBe(false);
  });

  it('YouTube: sets the Restricted Mode header on every request type, including the page', () => {
    const yt = byId(4);
    expect(yt.action.type).toBe('modifyHeaders');
    expect(yt.action.requestHeaders).toEqual([{ header: 'YouTube-Restrict', operation: 'set', value: 'Strict' }]);
    expect(yt.condition.resourceTypes).toEqual(ALL_RESOURCE_TYPES);
    expect(yt.condition.requestDomains).toContain('youtube.com');
    expect(yt.condition.requestDomains).toContain('youtubei.googleapis.com');
  });

  it('refuses to build with no Google domains', () => {
    expect(() => buildSafeSearchRules([])).toThrow();
  });
});

describe('safeSearchHostPermissions', () => {
  it('asks only for the search and YouTube sites, never all sites', () => {
    const perms = safeSearchHostPermissions(google);
    expect(perms).toContain('*://*.google.com.ng/*');
    expect(perms).toContain('*://*.bing.com/*');
    expect(perms).toContain('*://*.duckduckgo.com/*');
    expect(perms).toContain('*://*.youtube.com/*');
    expect(perms).not.toContain('<all_urls>');
    expect(perms).toHaveLength(google.length + 6);
  });
});
