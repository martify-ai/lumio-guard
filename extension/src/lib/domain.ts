// Turns blocklist lines into clean, comparable domain names.
// Runs at build time (Node) and can run in the extension (browser): it only uses URL.

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;
const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * Normalise one domain: lowercase, punycode (IDN → xn--), no trailing dot,
 * no leading "*.". Returns null for anything that is not a plain public-looking
 * hostname (IP addresses, single labels, paths, ports, bad characters).
 */
export function normalizeDomain(input: string): string | null {
  let d = input.trim().toLowerCase();
  if (!d) return null;
  if (d.startsWith('*.')) d = d.slice(2);
  while (d.endsWith('.')) d = d.slice(0, -1);
  if (!d || /[\s/:?#@\\]/.test(d)) return null;

  let host: string;
  try {
    host = new URL(`http://${d}`).hostname;
  } catch {
    return null;
  }
  if (!host || host !== host.toLowerCase()) return null;
  if (IPV4.test(host) || host.startsWith('[')) return null;
  if (host.length > 253) return null;

  const labels = host.split('.');
  if (labels.length < 2) return null;
  if (!labels.every((l) => LABEL.test(l))) return null;
  if (/^\d+$/.test(labels[labels.length - 1])) return null;
  return host;
}

/**
 * Extract the domain from one list line. Accepts:
 *   example.com
 *   0.0.0.0 example.com   /   127.0.0.1 example.com   (hosts files)
 *   ||example.com^        /   ||example.com^$third-party (adblock domain rules)
 * Comments (#, !) and blank lines give null. Rules with paths give null.
 */
export function domainFromLine(line: string): string | null {
  let s = line.replace(/\s#.*$/, '').trim();
  if (!s || s.startsWith('#') || s.startsWith('!') || s.startsWith('[')) return null;

  const hosts = s.match(/^(?:0\.0\.0\.0|127\.0\.0\.1|::1?)\s+(\S+)$/);
  if (hosts) s = hosts[1];

  const adblock = s.match(/^\|\|([^\^/$|]+)\^(?:\$.*)?$/);
  if (adblock) s = adblock[1];
  else if (s.startsWith('||') || s.startsWith('@@')) return null;

  if (s === 'localhost' || s.endsWith('.localdomain')) return null;
  return normalizeDomain(s);
}

export interface ParsedList {
  domains: string[];
  rejected: number;
}

/** Parse a whole list file: normalised, de-duplicated, sorted. */
export function parseList(text: string): ParsedList {
  const set = new Set<string>();
  let rejected = 0;
  for (const raw of text.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) continue;
    const d = domainFromLine(trimmed);
    if (d) set.add(d);
    else rejected++;
  }
  return { domains: [...set].sort(), rejected };
}

/**
 * Chrome's requestDomains already matches subdomains, so "a.example.com" is
 * redundant when "example.com" is in the list. Removing them saves rule space.
 */
export function removeCoveredSubdomains(domains: string[]): string[] {
  const set = new Set(domains);
  return domains.filter((d) => {
    const parts = d.split('.');
    for (let i = 1; i < parts.length - 1; i++) {
      if (set.has(parts.slice(i).join('.'))) return false;
    }
    return true;
  });
}

/** True when host is the domain itself or one of its subdomains. */
export function isSameOrSubdomain(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}
