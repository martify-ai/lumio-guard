import { describe, expect, it } from 'vitest';
import {
  applyNeverBlock,
  isBlockedBy,
  domainFromLine,
  isSameOrSubdomain,
  normalizeDomain,
  parseList,
  removeCoveredSubdomains,
} from '../../src/lib/domain';

describe('normalizeDomain', () => {
  it('lowercases and strips trailing dots', () => {
    expect(normalizeDomain('WWW.Example.COM.')).toBe('www.example.com');
  });
  it('strips a leading wildcard', () => {
    expect(normalizeDomain('*.example.com')).toBe('example.com');
  });
  it('turns international names into punycode', () => {
    expect(normalizeDomain('bücher.de')).toBe('xn--bcher-kva.de');
  });
  it.each([
    ['', 'empty'],
    ['localhost', 'single label'],
    ['192.168.0.1', 'IPv4'],
    ['[::1]', 'IPv6'],
    ['example.com/path', 'path'],
    ['example.com:8080', 'port'],
    ['user@example.com', 'userinfo'],
    ['exa mple.com', 'space'],
    ['-bad.example.com', 'label starting with hyphen'],
    ['example.123', 'numeric TLD'],
    [`${'a'.repeat(64)}.com`, 'label too long'],
  ])('rejects %s (%s)', (input) => {
    expect(normalizeDomain(input)).toBeNull();
  });
});

describe('domainFromLine', () => {
  it.each([
    ['example.com', 'example.com'],
    ['0.0.0.0 example.com', 'example.com'],
    ['127.0.0.1\texample.com', 'example.com'],
    ['||example.com^', 'example.com'],
    ['||example.com^$third-party', 'example.com'],
    ['example.com # trailing comment', 'example.com'],
  ])('reads %s', (line, expected) => {
    expect(domainFromLine(line)).toBe(expected);
  });
  it.each([
    '# comment',
    '! adblock comment',
    '[Adblock Plus 2.0]',
    '@@||allowed.com^',
    '||example.com/path^',
    '0.0.0.0 localhost',
    '127.0.0.1 localhost.localdomain',
  ])('ignores %s', (line) => {
    expect(domainFromLine(line)).toBeNull();
  });
});

describe('parseList', () => {
  it('de-duplicates, sorts and counts rejected lines', () => {
    const text = '# header\nb.com\nA.com\n0.0.0.0 b.com\nnot a domain\n\n||c.com^\n';
    expect(parseList(text)).toEqual({ domains: ['a.com', 'b.com', 'c.com'], rejected: 1 });
  });
  it('handles Windows line endings', () => {
    expect(parseList('a.com\r\nb.com\r\n').domains).toEqual(['a.com', 'b.com']);
  });
});

describe('removeCoveredSubdomains', () => {
  it('drops subdomains of listed parents only', () => {
    expect(
      removeCoveredSubdomains(['example.com', 'www.example.com', 'a.b.example.com', 'other.com', 'notexample.com']),
    ).toEqual(['example.com', 'other.com', 'notexample.com']);
  });
  it('does not treat a TLD as a parent', () => {
    expect(removeCoveredSubdomains(['a.com', 'b.com'])).toEqual(['a.com', 'b.com']);
  });
});

describe('isSameOrSubdomain', () => {
  it('matches the domain and its subdomains', () => {
    expect(isSameOrSubdomain('example.com', 'example.com')).toBe(true);
    expect(isSameOrSubdomain('m.example.com', 'example.com')).toBe(true);
  });
  it('does not match lookalikes', () => {
    expect(isSameOrSubdomain('notexample.com', 'example.com')).toBe(false);
    expect(isSameOrSubdomain('example.com.evil.net', 'example.com')).toBe(false);
  });
});

describe('applyNeverBlock', () => {
  const never = ['wikipedia.org', 'bbc.co.uk', 'jamb.gov.ng'];
  it('removes a protected site and any parent of it, and reports them', () => {
    const r = applyNeverBlock(['bad.com', 'wikipedia.org', 'co.uk', 'gov.ng', 'other.net'], never);
    expect(r.kept).toEqual(['bad.com', 'other.net']);
    expect(r.removed).toEqual(['wikipedia.org', 'co.uk', 'gov.ng']);
  });
  it('keeps a specific subdomain under a protected site, and lookalikes', () => {
    const r = applyNeverBlock(['ads.wikipedia.org', 'notwikipedia.org', 'wikipedia.org.evil.com'], never);
    expect(r.removed).toEqual([]);
  });
  it('after filtering, no protected site is blocked', () => {
    const { kept } = applyNeverBlock(['wikipedia.org', 'co.uk', 'bad.com'], never);
    const set = new Set(kept);
    for (const d of never) expect(isBlockedBy(d, set)).toBe(false);
    expect(isBlockedBy('www.bad.com', set)).toBe(true);
    expect(isBlockedBy('notbad.com', set)).toBe(false);
  });
});
