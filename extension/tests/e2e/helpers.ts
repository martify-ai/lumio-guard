import { chromium, type BrowserContext, type Page, type Worker } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const DIST = resolve(here, '../../dist');
export const DIST_TEST = resolve(here, '../../dist-test');

export interface Launched {
  context: BrowserContext;
  worker: Worker;
  extensionId: string;
  userDataDir: string;
}

/** Launch Chromium with the unpacked extension loaded. */
export async function launch(extDir = DIST, userDataDir = mkdtempSync(join(tmpdir(), 'lg-e2e-'))): Promise<Launched> {
  const context = await chromium.launchPersistentContext(userDataDir, {
    // E2E_CHANNEL picks the browser: 'chromium' (Playwright's build, default) or an
    // installed Chromium browser such as 'msedge'. Branded Chrome 137+ ignores --load-extension.
    channel: process.env.E2E_CHANNEL ?? 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extDir}`, `--load-extension=${extDir}`],
  });
  // Browsers such as Edge run their own built-in extension workers too; pick ours.
  const ours = (w: Worker) => w.url().startsWith('chrome-extension://') && w.url().endsWith('/background.js');
  const worker =
    context.serviceWorkers().find(ours) ??
    (await context.waitForEvent('serviceworker', { predicate: ours, timeout: 15_000 }));
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
export async function waitForRulesets(worker: Worker, expected: string[]): Promise<void> {
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
