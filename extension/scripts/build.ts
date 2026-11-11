// Builds the unpacked extension into dist/ (or --out <dir>).
//   npm run build                      → dist/ (what you load into Chrome)
//   npm run build:test                 → dist-test/ with all-sites access pre-granted (e2e only)
// Options: --lists <dir> (default ../packages/blocklists/test), --per-rule <n>

import { build } from 'esbuild';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseList, removeCoveredSubdomains } from '../src/lib/domain';
import { buildRuleset, DEFAULT_DOMAINS_PER_RULE, rulesetId } from '../src/lib/rules';
import type { Category } from '../src/lib/policy';
import {
  buildSafeSearchRules,
  SAFESEARCH_RULESET_ID,
  safeSearchHostPermissions,
} from '../src/lib/safesearch';
import { ENTERTAINMENT_DOMAINS } from '../src/lib/wellbeing';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const args = process.argv.slice(2);
const opt = (name: string, fallback: string) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const outDir = resolve(root, opt('--out', 'dist'));
// Default: the real lists if `npm run lists` has built them, otherwise the fake test lists.
const realLists = resolve(root, '../packages/blocklists/real');
const usingReal = !args.includes('--lists') && existsSync(join(realLists, 'adult.txt'));
const listsDir = usingReal ? realLists : resolve(root, opt('--lists', '../packages/blocklists/test'));
const perRule = Number(opt('--per-rule', String(DEFAULT_DOMAINS_PER_RULE)));
const testHostAccess = args.includes('--test-host-access');
const testHooks = args.includes('--test-hooks');

const categories: Category[] = JSON.parse(
  readFileSync(resolve(root, '../packages/blocklists/categories.json'), 'utf8'),
).categories;

rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, 'rules'), { recursive: true });

const ruleResources: { id: string; enabled: boolean; path: string }[] = [];
const report: Record<string, unknown> = { listsDir, realLists: usingReal, perRule, categories: {} };

for (const c of categories) {
  const file = join(listsDir, `${c.id}.txt`);
  if (!existsSync(file)) throw new Error(`Missing list for category "${c.id}": ${file}`);
  const parsed = parseList(readFileSync(file, 'utf8'));
  const domains = removeCoveredSubdomains(parsed.domains);
  for (const mode of ['block', 'page'] as const) {
    const rules = buildRuleset(c.id, domains, mode, perRule);
    const id = rulesetId(c.id, mode);
    writeFileSync(join(outDir, 'rules', `${id}.json`), JSON.stringify(rules));
    // Plain-mode rules are on from the moment of install, before any code runs.
    ruleResources.push({ id, enabled: mode === 'block' && c.defaultOn, path: `rules/${id}.json` });
  }
  (report.categories as Record<string, unknown>)[c.id] = {
    domains: domains.length,
    rejectedLines: parsed.rejected,
    rulesPerMode: Math.ceil(domains.length / perRule),
  };
}

// Safe Search: on from install, like the plain block rules.
const googleDomains = parseList(
  readFileSync(resolve(root, '../packages/safesearch/google-domains.txt'), 'utf8'),
).domains;
writeFileSync(
  join(outDir, 'rules', `${SAFESEARCH_RULESET_ID}.json`),
  JSON.stringify(buildSafeSearchRules(googleDomains)),
);
ruleResources.push({ id: SAFESEARCH_RULESET_ID, enabled: true, path: `rules/${SAFESEARCH_RULESET_ID}.json` });
report.safeSearch = { googleDomains: googleDomains.length };

const manifest = JSON.parse(readFileSync(join(root, 'static/manifest.json'), 'utf8'));
manifest.declarative_net_request.rule_resources = ruleResources;
// Site access: Safe Search sites, plus the entertainment sites where the break
// reminder may appear on the page.
manifest.host_permissions = testHostAccess
  ? ['<all_urls>']
  : [...new Set([...safeSearchHostPermissions(googleDomains), ...ENTERTAINMENT_DOMAINS.map((d) => `*://*.${d}/*`)])];
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

for (const f of ['popup.html', 'options.html', 'blocked.html', 'break.html', 'ui.css', 'icon16.png', 'icon48.png', 'icon128.png']) {
  cpSync(join(root, 'static', f), join(outDir, f));
}

await build({
  entryPoints: ['background', 'popup', 'options', 'blocked', 'break'].map((n) => join(root, 'src', `${n}.ts`)),
  outdir: outDir,
  bundle: true,
  format: 'esm',
  target: 'chrome120',
  define: { LG_TEST: String(testHooks) },
  logLevel: 'warning',
});

writeFileSync(join(outDir, 'build-report.json'), JSON.stringify(report, null, 2));
console.log(`Built ${outDir}`);
console.log(usingReal ? 'Lists: REAL blocklists' : `Lists: ${listsDir} (run "npm run lists" first for real blocklists)`);
console.log(JSON.stringify(report.categories, null, 2));
