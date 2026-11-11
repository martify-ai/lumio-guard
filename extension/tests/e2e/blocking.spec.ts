// Real-browser checks of Milestone 1. Uses only fake .test domains.
import { expect, test } from '@playwright/test';
import { BLOCKED, DIST, DIST_TEST, launch, navError, NOT_BLOCKED, waitForRulesets } from './helpers';

test.describe('plain mode (default install)', () => {
  test('blocks listed sites, their subdomains and every list format', async () => {
    const { context, worker } = await launch();
    await waitForRulesets(worker, ['adult-block', 'gambling-block']);
    const page = await context.newPage();

    for (const url of [
      'http://adult-example.test/',
      'https://adult-example.test/some/path?q=1',
      'http://sub.adult-example.test/',
      'http://adult-hosts-format.test/',
      'http://adult-adblock-format.test/',
      'http://www.adult-uppercase.test/',
      'http://betting-example.test/',
      'http://casino-example.test/',
    ]) {
      expect(await navError(page, url), url).toBe(BLOCKED);
    }
    await context.close();
  });

  test('does not block sites that are not on a list', async () => {
    // Each visit waits for DNS to say "no such site", which is slow on some networks.
    test.setTimeout(180_000);
    const { context, worker } = await launch();
    await waitForRulesets(worker, ['adult-block', 'gambling-block']);
    const page = await context.newPage();
    for (const url of [
      'http://safe-example.test/',
      'http://notadult-example.test/', // lookalike of adult-example.test
      'http://adult-example.test.safe-example.test/', // listed name inside another name
      'http://adult-uppercase.test/', // only www. was listed
    ]) {
      expect(await navError(page, url), url).toBe(NOT_BLOCKED);
    }
    await context.close();
  });

  test('blocks images, scripts and frames from listed sites on other pages', async () => {
    const { context, worker } = await launch();
    await waitForRulesets(worker, ['adult-block', 'gambling-block']);
    const page = await context.newPage();
    const failures = new Map<string, string>();
    page.on('requestfailed', (r) => failures.set(r.url(), r.failure()?.errorText ?? ''));
    await page.setContent(`
      <img src="http://adult-ads-network.test/banner.png">
      <script src="http://betting-example.test/ad.js"></script>
      <iframe src="http://adult-example.test/embed"></iframe>
      <img src="http://safe-example.test/ok.png">`);
    await page.waitForTimeout(1500);
    expect(failures.get('http://adult-ads-network.test/banner.png')).toContain(BLOCKED);
    expect(failures.get('http://betting-example.test/ad.js')).toContain(BLOCKED);
    expect(failures.get('http://adult-example.test/embed')).toContain(BLOCKED);
    expect(failures.get('http://safe-example.test/ok.png')).toContain(NOT_BLOCKED);
    await context.close();
  });

  test('a group switched off in Settings stops blocking, and on again blocks', async () => {
    const { context, worker, extensionId } = await launch();
    await waitForRulesets(worker, ['adult-block', 'gambling-block']);
    const settings = await context.newPage();
    await settings.goto(`chrome-extension://${extensionId}/options.html`);

    await settings.locator('#cat-gambling').uncheck();
    await waitForRulesets(worker, ['adult-block']);
    const page = await context.newPage();
    expect(await navError(page, 'http://casino-example.test/')).toBe(NOT_BLOCKED);
    expect(await navError(page, 'http://adult-example.test/')).toBe(BLOCKED);
    await expect(settings.locator('#status')).toContainText('partly on');

    await settings.locator('#cat-gambling').check();
    await waitForRulesets(worker, ['adult-block', 'gambling-block']);
    expect(await navError(page, 'http://casino-example.test/')).toBe(BLOCKED);
    await context.close();
  });

  test('settings and protection survive a browser restart', async () => {
    const first = await launch();
    await first.worker.evaluate(() =>
      chrome.storage.local.set({ settings: { categories: { adult: true, gambling: false }, friendlyPage: false } }),
    );
    await waitForRulesets(first.worker, ['adult-block']);
    await first.context.close();

    const second = await launch(DIST, first.userDataDir);
    await waitForRulesets(second.worker, ['adult-block']);
    const page = await second.context.newPage();
    expect(await navError(page, 'http://adult-example.test/')).toBe(BLOCKED);
    expect(await navError(page, 'http://casino-example.test/')).toBe(NOT_BLOCKED);
    await second.context.close();
  });

  test('popup reports protection status and the Incognito gap', async () => {
    const { context, worker, extensionId } = await launch();
    await waitForRulesets(worker, ['adult-block', 'gambling-block']);
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(popup.locator('#headline')).toHaveText('Protection is on');
    await expect(popup.locator('#categories li')).toHaveCount(4);
    await expect(popup.locator('#reminders-row')).toContainText('On');
    await expect(popup.locator('#incognito')).toBeVisible(); // not allowed in Incognito by default
    await context.close();
  });

  test('the friendly block page cannot be switched on without all-sites access', async () => {
    const { context, worker } = await launch();
    await worker.evaluate(() =>
      chrome.storage.local.set({ settings: { categories: { adult: true, gambling: true }, friendlyPage: true } }),
    );
    // No host access granted → stays in plain mode, still blocking.
    await waitForRulesets(worker, ['adult-block', 'gambling-block']);
    const page = await context.newPage();
    expect(await navError(page, 'http://adult-example.test/')).toBe(BLOCKED);
    await context.close();
  });
});

test.describe('friendly mode (all-sites access granted, test build)', () => {
  test('shows the calm Lumio page without the blocked address', async () => {
    const { context, worker, extensionId } = await launch(DIST_TEST);
    await worker.evaluate(() =>
      chrome.storage.local.set({ settings: { categories: { adult: true, gambling: true }, friendlyPage: true } }),
    );
    await waitForRulesets(worker, ['adult-block', 'gambling-block', 'adult-page', 'gambling-page']);
    const page = await context.newPage();
    await page.goto('http://sub.adult-example.test/secret-path');
    expect(page.url()).toBe(`chrome-extension://${extensionId}/blocked.html?c=adult`);
    await expect(page.locator('h1')).toHaveText("This page isn't available");
    await expect(page.locator('#category')).toHaveText('Adult content');
    const text = await page.locator('body').innerText();
    expect(text).not.toContain('adult-example');
    expect(text).not.toContain('secret-path');

    await page.goto('http://betting-example.test/');
    await expect(page.locator('#category')).toHaveText('Betting and gambling');
    await context.close();
  });
});

test('extension pages make no network requests', async () => {
  const { context, worker, extensionId } = await launch(DIST_TEST);
  await waitForRulesets(worker, ['adult-block', 'gambling-block']);
  const outbound: string[] = [];
  context.on('request', (r) => {
    if (/^https?:/.test(r.url()) && r.frame().url().startsWith('chrome-extension://')) outbound.push(r.url());
  });
  const page = await context.newPage();
  for (const p of ['popup.html', 'options.html', 'blocked.html?c=adult', 'break.html']) {
    await page.goto(`chrome-extension://${extensionId}/${p}`);
    await page.waitForLoadState('networkidle');
  }
  expect(outbound).toEqual([]);
  await context.close();
});
