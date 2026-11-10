// Safe Search rules. Chrome applies them itself (declarativeNetRequest); the
// extension never sees search words or addresses.
//
//   Google      → adds  safe=active  to search addresses
//   Bing        → adds  adlt=strict
//   DuckDuckGo  → adds  kp=1
//   YouTube     → sends the "YouTube-Restrict: Strict" header (Google's documented
//                 way to force Restricted Mode from outside the page)
//
// Chrome skips a redirect when the address would not change, so these do not loop.

import { ALL_RESOURCE_TYPES } from './rules';

type Rule = chrome.declarativeNetRequest.Rule;
type ResourceType = chrome.declarativeNetRequest.ResourceType;

export const SAFESEARCH_RULESET_ID = 'safesearch';

export const YOUTUBE_DOMAINS = [
  'youtube.com',
  'youtubei.googleapis.com',
  'youtube.googleapis.com',
  'youtube-nocookie.com',
];
export const BING_DOMAINS = ['bing.com'];
export const DUCKDUCKGO_DOMAINS = ['duckduckgo.com'];

/** Names shown to the user. Anything not listed here is NOT covered. */
export const COVERED_ENGINES = ['Google', 'Bing', 'DuckDuckGo', 'YouTube'];

const PAGE_TYPES = ['main_frame', 'sub_frame', 'xmlhttprequest'] as ResourceType[];

function addParam(id: number, domains: string[], regexFilter: string, key: string, value: string): Rule {
  return {
    id,
    priority: 1,
    action: {
      type: 'redirect' as chrome.declarativeNetRequest.RuleActionType,
      redirect: { transform: { queryTransform: { addOrReplaceParams: [{ key, value }] } } },
    },
    condition: { requestDomains: domains, regexFilter, resourceTypes: PAGE_TYPES },
  };
}

export function buildSafeSearchRules(googleDomains: string[]): Rule[] {
  if (googleDomains.length === 0) throw new Error('No Google domains given');
  return [
    addParam(1, googleDomains, '^https?://(www\\.)?google\\.[a-z.]+/search', 'safe', 'active'),
    addParam(2, BING_DOMAINS, '^https?://(www\\.)?bing\\.com/(search|images|videos)', 'adlt', 'strict'),
    addParam(3, DUCKDUCKGO_DOMAINS, '^https?://([a-z]+\\.)?duckduckgo\\.com/(html/?|lite/?)?\\?', 'kp', '1'),
    {
      id: 4,
      priority: 1,
      action: {
        type: 'modifyHeaders' as chrome.declarativeNetRequest.RuleActionType,
        requestHeaders: [
          {
            header: 'YouTube-Restrict',
            operation: 'set' as chrome.declarativeNetRequest.HeaderOperation,
            value: 'Strict',
          },
        ],
      },
      // Listed in full: with no list, Chrome leaves out the page itself (main_frame).
      condition: { requestDomains: YOUTUBE_DOMAINS, resourceTypes: ALL_RESOURCE_TYPES as ResourceType[] },
    },
  ];
}

/** Site access Chrome needs before it will change these requests. */
export function safeSearchHostPermissions(googleDomains: string[]): string[] {
  return [...googleDomains, ...BING_DOMAINS, ...DUCKDUCKGO_DOMAINS, ...YOUTUBE_DOMAINS].map(
    (d) => `*://*.${d}/*`,
  );
}
