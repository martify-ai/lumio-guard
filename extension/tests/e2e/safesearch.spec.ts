// Real-browser checks of Safe Search. Nothing is sent to Google, Bing, DuckDuckGo
// or YouTube:
//  - search-address tests answer the request inside the test (context.route) and
//    check the address Chrome ended up asking for;
//  - YouTube tests send www.youtube.com to a local stand-in server, which sees the
//    real headers Chrome sends after the extension's rules have run.
import { expect, test, type BrowserContext } from '@playwright/test';
import { DIST, launch, startStandIn, waitForRulesets } from './helpers';

/** Answer every web request locally. Extension pages are left alone. */
async function stubWeb(context: BrowserContext): Promise<void> {
  await context.route(/^https?:\/\//, (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<title>stub</title>ok' }),
  );
}

const BOTH = ['adult-block', 'gambling-block'];
const YT_HOSTS = ['www.youtube.com', 'youtubei.googleapis.com', 'example.com'];

test('adds the safe setting to Google, Bing and DuckDuckGo searches', async () => {
  const { context, worker } = await launch();
  await waitForRulesets(worker, BOTH);
  await stubWeb(context);
  const page = await context.newPage();

  const cases: [string, string, string][] = [
    ['https://www.google.com/search?q=flowers', 'safe', 'active'],
    ['https://www.google.com.ng/search?q=flowers&tbm=isch', 'safe', 'active'],
    ['https://www.google.com/search?q=flowers&safe=off', 'safe', 'active'], // cannot be switched off
    ['https://www.bing.com/search?q=flowers', 'adlt', 'strict'],
    ['https://www.bing.com/images/search?q=flowers&adlt=off', 'adlt', 'strict'],
    ['https://duckduckgo.com/?q=flowers', 'kp', '1'],
    ['https://duckduckgo.com/?q=flowers&kp=-2', 'kp', '1'],
  ];
  for (const [url, key, value] of cases) {
    await page.goto(url);
    const final = new URL(page.url());
    expect(final.searchParams.getAll(key), url).toEqual([value]);
    expect(final.searchParams.get('q'), url).toBe('flowers');
  }
  await context.close();
});

test('leaves other pages on those sites alone', async () => {
  const { context, worker } = await launch();
  await waitForRulesets(worker, BOTH);
  await stubWeb(context);
  const page = await context.newPage();
  for (const url of [
    'https://www.google.com/maps/search/flowers',
    'https://www.bing.com/maps?q=flowers',
    'https://example.com/search?q=flowers',
  ]) {
    await page.goto(url);
    expect(page.url(), url).toBe(url);
  }
  await context.close();
});

test('sends the YouTube Restricted Mode header, and only to YouTube', async () => {
  const standIn = await startStandIn();
  const { context, worker } = await launch(DIST, undefined, standIn.args(YT_HOSTS));
  await waitForRulesets(worker, BOTH);
  const page = await context.newPage();

  await page.goto('https://www.youtube.com/watch?v=abc');
  await page.evaluate(() => fetch('https://youtubei.googleapis.com/youtubei/v1/search').then((r) => r.text()));
  await page.goto('https://example.com/');

  const header = (host: string) => standIn.seen.find((s) => s.host === host)?.headers['youtube-restrict'];
  expect(standIn.seen.map((s) => s.host)).toEqual(expect.arrayContaining(YT_HOSTS));
  expect(header('www.youtube.com')).toBe('Strict'); // the page itself
  expect(header('youtubei.googleapis.com')).toBe('Strict'); // background data request
  expect(header('example.com')).toBeUndefined();
  await context.close();
  await standIn.close();
});

test('switching Safe Search off in Settings stops it, and status says so', async () => {
  const standIn = await startStandIn();
  const { context, worker, extensionId } = await launch(DIST, undefined, standIn.args(YT_HOSTS));
  await waitForRulesets(worker, BOTH);
  const settings = await context.newPage();
  await settings.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(settings.locator('#safesearch')).toBeChecked();
  await settings.locator('#safesearch').uncheck();
  await waitForRulesets(worker, BOTH, false);
  await expect(settings.locator('#status')).toContainText('partly on');

  const page = await context.newPage();
  await page.goto('https://www.youtube.com/watch?v=abc');
  expect(standIn.seen.find((s) => s.host === 'www.youtube.com')).toBeTruthy();
  expect(standIn.seen.find((s) => s.host === 'www.youtube.com')?.headers['youtube-restrict']).toBeUndefined();

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(popup.locator('#headline')).toHaveText('Some protection is off');
  await expect(popup.locator('#safesearch-row')).toContainText('Off');

  await stubWeb(context);
  await page.goto('https://www.google.com/search?q=flowers');
  expect(page.url()).toBe('https://www.google.com/search?q=flowers');
  await context.close();
  await standIn.close();
});
