# Blocklist capacity — spike results

Question: Chrome guarantees an extension only 30,000 static blocking rules, but one adult-site
list alone has ~953,000 domains. Do big lists fit?

**Answer: yes.** One rule can carry many domains (`requestDomains`), and Chrome counts rules,
not domains. 1,000,000 domains fit in as few as 10 rules and every check passed.

Run on 2026-11-10 with `npm run spike:capacity` (Playwright Chromium 156, Windows 10,
synthetic `.test` domains, one category).

| Domains | Domains per rule | Rules | Extension size | Start-up to rules ready | First/last/subdomain blocked | Lookalike allowed |
|---|---|---|---|---|---|---|
| 30,000 | 1 | 30,000 | 30.9 MB | 14.8 s | yes | yes |
| 100,000 | 1,000 | 100 | 13.3 MB | 9.9 s | yes | yes |
| 1,000,000 | 1,000 | 1,000 | 139.1 MB | 18.1 s | yes | yes |
| 1,000,000 | 10,000 | 100 | 138.3 MB | 23.4 s | yes | yes |
| 1,000,000 | 100,000 | 10 | 138.2 MB | 23.1 s | yes | yes |

Start-up times include launching the browser, so treat them as upper bounds, not rule-loading
time alone. Page-load speed with large lists was not measured.

## What this means

- The rule limit is not a problem. `DEFAULT_DOMAINS_PER_RULE = 1000` stays.
- **Download size is the real cost.** 1,000,000 domains made a 139 MB extension, because each
  category ships two rulesets (plain mode and friendly-page mode), so every domain is stored
  about three times. Before using lists this large:
  1. Store the friendly-mode rules more cheaply (for example one ruleset plus a small
     higher-priority redirect layer), and
  2. Remove dead domains and subdomains already covered by a parent, and
  3. Measure page-load speed and memory with the real list.
- Not yet tested: branded Google Chrome (it refuses test-loaded extensions; needs a manual
  check), and memory use.
