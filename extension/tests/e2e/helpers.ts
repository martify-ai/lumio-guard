import { chromium, type BrowserContext, type Page, type Worker } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import type { IncomingHttpHeaders } from 'node:http';
import { createServer } from 'node:https';
import type { AddressInfo } from 'node:net';
import selfsigned from 'selfsigned';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
/** Built from the fake test lists (npm run build:e2e). */
export const DIST = resolve(here, '../../dist-e2e');
/** The build you load into Chrome; has the real lists once `npm run lists` has run. */
export const DIST_REAL = resolve(here, '../../dist');
export const DIST_TEST = resolve(here, '../../dist-test');
/** Real permissions plus the test-only activity switch (see wellbeing-runtime.ts). */
export const DIST_HOOKS = resolve(here, '../../dist-hooks');

export interface Launched {
  context: BrowserContext;
  worker: Worker;
  extensionId: string;
  userDataDir: string;
}

/** Launch Chromium with the unpacked extension loaded. */
export async function launch(
  extDir = DIST,
  userDataDir = mkdtempSync(join(tmpdir(), 'lg-e2e-')),
  extraArgs: string[] = [],
): Promise<Launched> {
  const context = await chromium.launchPersistentContext(userDataDir, {
    // E2E_CHANNEL picks the browser: 'chromium' (Playwright's build, default) or an
    // installed Chromium browser such as 'msedge'. Branded Chrome 137+ ignores --load-extension.
    channel: process.env.E2E_CHANNEL ?? 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extDir}`, `--load-extension=${extDir}`, ...extraArgs],
  });
  // Browsers such as Edge run their own built-in extension workers too; pick ours.
  const ours = (w: Worker) => w.url().startsWith('chrome-extension://') && w.url().endsWith('/background.js');
  const worker =
    context.serviceWorkers().find(ours) ??
    (await context.waitForEvent('serviceworker', { predicate: ours, timeout: 45_000 }));
  const extensionId = new URL(worker.url()).host;
  return { context, worker, extensionId, userDataDir };
}

/** The network error Chrome gives a navigation, or null if it loaded. */
export async function navError(page: Page, url: string): Promise<string | null> {
  try {
    await page.goto(url, { timeout: 15_000 });
    return null;
  } catch (e) {
    const m = String(e).match(/net::(ERR_[A-Z_]+)/);
    return m ? m[1] : String(e);
  }
}

export const BLOCKED = 'ERR_BLOCKED_BY_CLIENT';
/** .test names never resolve, so an unblocked .test site fails DNS instead. */
export const NOT_BLOCKED = 'ERR_NAME_NOT_RESOLVED';

/** Wait until the background worker has applied the expected rulesets. */
export async function waitForRulesets(worker: Worker, wanted: string[], safeSearch = true): Promise<void> {
  const expected = safeSearch ? [...wanted, 'safesearch'] : wanted;
  await expectEventually(async () => {
    const on: string[] = await worker.evaluate(() => chrome.declarativeNetRequest.getEnabledRulesets());
    return expected.every((id) => on.includes(id)) && on.length === expected.length;
  });
}

export async function expectEventually(check: () => Promise<boolean>, ms = 10_000): Promise<void> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Condition not met in time');
}

export interface StandIn {
  /** Every request the stand-in server received: host, path and headers as Chrome sent them. */
  seen: { host: string; path: string; headers: IncomingHttpHeaders }[];
  /** Browser flags that send the given real hostnames to the stand-in instead of the internet. */
  args: (hosts: string[]) => string[];
  close: () => Promise<void>;
}

/**
 * A local HTTPS server that stands in for real sites (e.g. www.youtube.com), so tests
 * can see exactly what Chrome sends after the extension's rules have run, without
 * contacting the real site.
 */
export async function startStandIn(): Promise<StandIn> {
  const cert = selfsigned.generate([{ name: 'commonName', value: 'lumio-guard-test' }], { days: 1, keySize: 2048 });
  const seen: StandIn['seen'] = [];
  const server = createServer({ key: cert.private, cert: cert.cert }, (req, res) => {
    seen.push({ host: req.headers.host ?? '', path: req.url ?? '', headers: req.headers });
    res.writeHead(200, { 'content-type': 'text/html', 'access-control-allow-origin': '*' });
    res.end('<title>stand-in</title>ok');
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const port = (server.address() as AddressInfo).port;
  return {
    seen,
    args: (hosts) => [
      `--host-resolver-rules=${hosts.map((h) => `MAP ${h} 127.0.0.1:${port}`).join(', ')}`,
      '--ignore-certificate-errors',
    ],
    close: () => new Promise((r) => server.close(() => r())),
  };
}
