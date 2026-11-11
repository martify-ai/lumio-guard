// Builds Chrome declarativeNetRequest static rulesets from a category's domains.
//
// Two rulesets per category:
//   "<cat>-block" — always on with the category: block every request, including the
//                   page itself. Chrome shows its own "blocked" page. No host access.
//   "<cat>-page"  — added on top in friendly mode: a higher-priority rule that sends
//                   the page itself to our blocked.html. Needs "all sites" access.
// Everything else stays blocked by "<cat>-block", so each domain is stored twice,
// not three times (see docs/CAPACITY.md).

type Rule = chrome.declarativeNetRequest.Rule;
// Written out by hand: @types/chrome lags behind Chrome and lacks webtransport/webbundle.
type ResourceType =
  | `${chrome.declarativeNetRequest.ResourceType}`
  | 'webtransport'
  | 'webbundle';

export const ALL_RESOURCE_TYPES: ResourceType[] = [
  'main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font', 'object',
  'xmlhttprequest', 'ping', 'csp_report', 'media', 'websocket', 'webtransport',
  'webbundle', 'other',
];

/** Domains packed into one rule. Set from the capacity spike; see docs/CAPACITY.md. */
export const DEFAULT_DOMAINS_PER_RULE = 1000;

export type Mode = 'block' | 'page';

export function rulesetId(category: string, mode: Mode): string {
  return `${category}-${mode}`;
}

export function blockedPagePath(category: string): string {
  return `/blocked.html?c=${encodeURIComponent(category)}`;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function buildRuleset(
  category: string,
  domains: string[],
  mode: Mode,
  domainsPerRule = DEFAULT_DOMAINS_PER_RULE,
): Rule[] {
  if (!/^[a-z0-9_]+$/.test(category)) throw new Error(`Bad category id: ${category}`);
  if (domainsPerRule < 1) throw new Error('domainsPerRule must be at least 1');

  const rules: Rule[] = [];
  let id = 1;
  for (const group of chunk(domains, domainsPerRule)) {
    if (mode === 'block') {
      rules.push({
        id: id++,
        priority: 1,
        action: { type: 'block' as chrome.declarativeNetRequest.RuleActionType },
        condition: {
          requestDomains: group,
          resourceTypes: ALL_RESOURCE_TYPES as chrome.declarativeNetRequest.ResourceType[],
        },
      });
    } else {
      rules.push({
        id: id++,
        priority: 2, // wins over the block rule for the page itself
        action: {
          type: 'redirect' as chrome.declarativeNetRequest.RuleActionType,
          redirect: { extensionPath: blockedPagePath(category) },
        },
        condition: {
          requestDomains: group,
          resourceTypes: ['main_frame'] as chrome.declarativeNetRequest.ResourceType[],
        },
      });
    }
  }
  return rules;
}
