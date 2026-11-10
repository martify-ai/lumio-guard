// Real-browser checks of the break reminders. Uses the "hooks" test build: the
// real permissions, plus a test-only switch to pretend the browser is in use.
// Real sites are replaced by a local stand-in server, so nothing reaches them.
import { expect, test, type Worker } from '@playwright/test';
import { DIST_HOOKS, expectEventually, launch, startStandIn, waitForRulesets } from './helpers';

const BOTH = ['adult-block', 'gambling-block'];
const HOSTS = ['www.youtube.com', 'example.com'];
const MIN = 60_000;

/** Put the timer just short of `minutes` of active use, then tick it past. */
async function reach(worker: Worker, minutes: number): Promise<void> {
  await worker.evaluate(async ([m, MINUTE]) => {
    const now = Date.now();
    const saved = (await chrome.storage.local.get('wellbeing')).wellbeing ?? { fired: [], days: {} };
    await chrome.storage.local.set({
      wellbeing: { ...saved, sessionMs: m * MINUTE - 5_000, lastTickAt: now - 30_000, lastActiveAt: now - 30_000, wasActive: true },
    });
    const t = (globalThis as any).__lgTest;
    t.setActive(true);
    await t.tick();
  }, [minutes, MIN]);
}

const stored = (worker: Worker) => worker.evaluate(() => chrome.storage.local.get(null));
const notifications = (worker: Worker) =>
  worker.evaluate(
    () => new Promise<string[]>((done) => chrome.notifications.getAll((n) => done(Object.keys(n)))),
  );

test('on an entertainment site the reminder appears on the page, and "Take a break" opens ideas', async () => {
  const standIn = await startStandIn();
  const { context, worker, extensionId } = await launch(DIST_HOOKS, undefined, standIn.args(HOSTS));
  await waitForRulesets(worker, BOTH);
  const page = await context.newPage();
  await page.goto('https://www.youtube.com/watch?v=abc');
  await page.bringToFront();

  await reach(worker, 15);
  const card = page.locator('#lumio-guard-reminder [role="dialog"]');
  await expect(card).toContainText("You've been browsing for 15 minutes");
  await expect(card.getByRole('button')).toHaveText(['Take a break', 'Keep going']);
  expect(await notifications(worker)).toEqual([]);

  await card.getByRole('button', { name: 'Take a break' }).click();
  await page.waitForURL(`chrome-extension://${extensionId}/break.html`);
  await expect(page.locator('#ideas li')).toHaveCount(3);
  const first = await page.locator('#ideas h2').allInnerTexts();
  await page.locator('#more').click();
  const second = await page.locator('#ideas h2').allInnerTexts();
  expect(second).toHaveLength(3);
  expect(second.some((t) => first.includes(t))).toBe(false);

  const data: any = await stored(worker);
  const today = Object.values(data.wellbeing.days)[0] as any;
  expect(today.prompts).toBe(1);
  expect(today.breaks).toBe(1);
  await context.close();
  await standIn.close();
});

test('"Keep going" just closes the reminder; the next one comes at the next threshold', async () => {
  const standIn = await startStandIn();
  const { context, worker } = await launch(DIST_HOOKS, undefined, standIn.args(HOSTS));
  await waitForRulesets(worker, BOTH);
  const page = await context.newPage();
  await page.goto('https://www.youtube.com/watch?v=abc');
  await page.bringToFront();

  await reach(worker, 15);
  const card = page.locator('#lumio-guard-reminder [role="dialog"]');
  await card.getByRole('button', { name: 'Keep going' }).click();
  await expect(page.locator('#lumio-guard-reminder')).toHaveCount(0);
  expect(page.url()).toBe('https://www.youtube.com/watch?v=abc');

  await worker.evaluate(() => (globalThis as any).__lgTest.tick()); // same threshold: nothing new
  await expect(page.locator('#lumio-guard-reminder')).toHaveCount(0);

  await reach(worker, 30);
  await expect(card).toContainText("That's 30 minutes");
  await reach(worker, 60);
  await expect(card).toContainText('an hour');
  await context.close();
  await standIn.close();
});

test('on any other site the reminder is a notification, and the page is not touched', async () => {
  const standIn = await startStandIn();
  const { context, worker } = await launch(DIST_HOOKS, undefined, standIn.args(HOSTS));
  await waitForRulesets(worker, BOTH);
  const page = await context.newPage();
  await page.goto('https://example.com/');
  await page.bringToFront();

  await reach(worker, 15);
  await expectEventually(async () => (await notifications(worker)).includes('lumio-guard-reminder-15'));
  await expect(page.locator('#lumio-guard-reminder')).toHaveCount(0);
  await context.close();
  await standIn.close();
});

test('nothing stored mentions a site, and reminders can be switched off', async () => {
  const standIn = await startStandIn();
  const { context, worker, extensionId } = await launch(DIST_HOOKS, undefined, standIn.args(HOSTS));
  await waitForRulesets(worker, BOTH);
  const page = await context.newPage();
  await page.goto('https://www.youtube.com/watch?v=abc');
  await page.bringToFront();
  await reach(worker, 15);
  await expect(page.locator('#lumio-guard-reminder')).toHaveCount(1);
  expect(JSON.stringify(await stored(worker))).not.toMatch(/youtube|example\.com|https?:/);

  const settings = await context.newPage();
  await settings.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(settings.locator('#t0')).toHaveValue('15');
  await settings.locator('#t1').fill('10'); // smaller than the first: refused
  await settings.locator('#t1').blur();
  await expect(settings.locator('#times-note')).toContainText('Not saved');
  await settings.locator('#t1').fill('25');
  await settings.locator('#t1').blur();
  await expect(settings.locator('#times-note')).toHaveText('Saved.');
  await settings.locator('#wellbeing').uncheck();
  await expectEventually(async () => ((await stored(worker)) as any).settings?.wellbeing?.enabled === false);
  expect(((await stored(worker)) as any).settings.wellbeing.thresholds).toEqual([15, 25, 60]);

  await page.bringToFront();
  await page.reload();
  await reach(worker, 25);
  await page.waitForTimeout(1000);
  await expect(page.locator('#lumio-guard-reminder')).toHaveCount(0);
  expect(await notifications(worker)).toEqual([]);

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(popup.locator('#time')).toContainText(/Browsing time: \d+ min this session, \d+ min today\./);
  await context.close();
  await standIn.close();
});
