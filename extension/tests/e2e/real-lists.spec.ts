// Checks the real blocklists in the build you load into Chrome (extension/dist).
// Skipped unless `npm run lists && npm run build` has been run.
// Blocked sites are stopped by Chrome before any network request is made, and the
// allowed sites are answered by the test itself, so no real site is contacted.
import { expect, test } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BLOCKED, DIST_REAL, launch, navError, waitForRulesets } from './helpers';

const reportFile = join(DIST_REAL, 'build-report.json');
const hasReal = existsSync(reportFile) && JSON.parse(readFileSync(reportFile, 'utf8')).realLists === true;

test.describe('real blocklists', () => {
  test.skip(!hasReal, 'Real lists not built. Run: npm run lists && npm run build');
  test.setTimeout(300_000);

  test('well-known adult and betting sites are blocked; everyday sites are not', async () => {
    const { context, worker } = await launch(DIST_REAL);
    await waitForRulesets(worker, ['adult-block', 'gambling-block']);
    const page = await context.newPage();

    for (const url of [
      'https://www.pornhub.com/',
      'https://xvideos.com/',
      'https://www.xnxx.com/',
      'https://www.bet9ja.com/',
      'https://www.sportybet.com/ng/',
      'https://www.betking.com/',
      'https://1xbet.ng/',
      'https://www.football.com/ng/',
      'https://m.bet365.com/',
    ]) {
      expect(await navError(page, url), url).toBe(BLOCKED);
    }

    await context.route(/^https?:\/\//, (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<title>stub</title>ok' }),
    );
    for (const url of [
      'https://en.wikipedia.org/wiki/Nigeria',
      'https://www.bible.com/',
      'https://www.biblegateway.com/',
      'https://www.who.int/',
      'https://www.nhs.uk/conditions/',
      'https://www.plannedparenthood.org/learn',
      'https://www.jamb.gov.ng/',
      'https://www.khanacademy.org/',
      'https://www.bbc.com/news',
      'https://punchng.com/',
      'https://www.espn.com/soccer/', // sport news is not betting
      'https://www.livescore.com/',
    ]) {
      expect(await navError(page, url), url).toBeNull();
    }
    await context.close();
  });
});
