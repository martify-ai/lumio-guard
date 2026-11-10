// Capacity spike: how many blocklist domains can one extension hold?
// Builds the extension with synthetic .test domains at several sizes and packing
// levels, loads each in Playwright's Chromium, and checks that the FIRST and LAST
// domains are blocked and that Chrome enabled the ruleset.
//   npm run spike:capacity
// Results print as a table; copy them into docs/CAPACITY.md.

import { execSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Must be set before Playwright loads (it reads the path at import time).
process.env.PLAYWRIGHT_BROWSERS_PATH ??= join(root, '.browsers');
const { chromium } = await import('@playwright/test');
const spikeDir = join(root, '.spike');

const CASES: { domains: number; perRule: number }[] = [
  { domains: 30_000, perRule: 1 }, // one domain per rule: the "obvious" approach
  { domains: 100_000, perRule: 1_000 },
  { domains: 1_000_000, perRule: 1_000 },
  { domains: 1_000_000, perRule: 10_000 },
  { domains: 1_000_000, perRule: 100_000 },
];

const name = (i: number) => `d${i}.spike-${(i % 97).toString(36)}.test`;

function dirSize(dir: string): number {
  return readdirSync(dir, { withFileTypes: true }).reduce(
    (s, e) => s + (e.isDirectory() ? dirSize(join(dir, e.name)) : statSync(join(dir, e.name)).size),
    0,
  );
}

async function blocked(page: import('@playwright/test').Page, host: string): Promise<boolean> {
  try {
    await page.goto(`http://${host}/`, { timeout: 15_000 });
    return false;
  } catch (e) {
    return String(e).includes('ERR_BLOCKED_BY_CLIENT');
  }
}

const results: Record<string, unknown>[] = [];
rmSync(spikeDir, { recursive: true, force: true });

for (const c of CASES) {
  const label = `${c.domains.toLocaleString()} domains, ${c.perRule.toLocaleString()}/rule`;
  const lists = join(spikeDir, `lists-${c.domains}`);
  mkdirSync(lists, { recursive: true });
  const all = Array.from({ length: c.domains }, (_, i) => name(i)).join('\n');
  writeFileSync(join(lists, 'adult.txt'), all);
  writeFileSync(join(lists, 'gambling.txt'), 'betting-example.test\n');

  const out = join(spikeDir, `ext-${c.domains}-${c.perRule}`);
  const tBuild = Date.now();
  execSync(`npx tsx scripts/build.ts --lists "${lists}" --per-rule ${c.perRule} --out "${out}"`, {
    cwd: root,
    stdio: 'ignore',
  });
  const buildMs = Date.now() - tBuild;

  const tLoad = Date.now();
  const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'lg-spike-')), {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${out}`, `--load-extension=${out}`],
  });
  let row: Record<string, unknown> = { case: label, rules: Math.ceil(c.domains / c.perRule), buildMs, sizeMB: +(dirSize(out) / 1e6).toFixed(1) };
  try {
    const ours = (w: import('@playwright/test').Worker) => w.url().endsWith('/background.js');
    const worker = ctx.serviceWorkers().find(ours) ?? (await ctx.waitForEvent('serviceworker', { predicate: ours, timeout: 60_000 }));
    const enabled: string[] = await worker.evaluate(() => chrome.declarativeNetRequest.getEnabledRulesets());
    const loadMs = Date.now() - tLoad;
    const page = await ctx.newPage();
    row = {
      ...row,
      loadMs,
      adultEnabled: enabled.includes('adult-block'),
      firstBlocked: await blocked(page, name(0)),
      lastBlocked: await blocked(page, name(c.domains - 1)),
      subdomainBlocked: await blocked(page, `www.${name(Math.floor(c.domains / 2))}`),
      lookalikeAllowed: !(await blocked(page, `x${name(0)}`)),
    };
  } catch (e) {
    row = { ...row, error: String(e).split('\n')[0] };
  } finally {
    await ctx.close();
  }
  results.push(row);
  console.log(JSON.stringify(row));
}

console.table(results);
