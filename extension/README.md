# Lumio Guard — Chrome extension (v0)

A local-only Manifest V3 extension. No account, no server, nothing leaves the computer.

## What it does

| Pillar | Feature |
|---|---|
| Protect | Blocks listed adult and betting sites, and their ads and pop-ups on other pages |
| Protect | Keeps Safe Search on for Google, Bing and DuckDuckGo, and YouTube Restricted Mode |
| Understand | Pop-up shows protection status and active browsing time (session and today) |
| Interrupt | Gentle reminders at 15 / 30 / 60 minutes (changeable). Never a lockout. |
| Redirect | A take-a-break page with three small ideas at a time |

## What it does not do

Other browsers, phone apps, total screen time, unknown sites, tamper resistance, accounts,
guardian dashboard, list updates, faith content. See `../docs/DECISIONS.md`.

## Commands

```bash
npm install               # once
npm run lists             # build the real blocklists (downloads pinned sources)
npm run build             # → dist/  (load this folder in chrome://extensions)
npm test                  # logic tests
npm run browsers:install  # once: test browser into .browsers/
npm run test:e2e          # real-browser tests
npm run typecheck
```

`npm run build` uses the real lists if `npm run lists` has been run, otherwise fake `.test`
sites. It prints which. To try it by hand, follow `../docs/V0_CHECKLIST.md`.

## Layout

| Path | What |
|---|---|
| `src/lib/` | Pure logic with unit tests: domain cleaning, rule building, settings, Safe Search rules, timer, break ideas |
| `src/background.ts`, `src/wellbeing-runtime.ts` | The service worker: applies rulesets, runs the timer, shows reminders |
| `src/popup.ts`, `options.ts`, `blocked.ts`, `break.ts` + `static/*.html` | The four pages |
| `scripts/build.ts` | Turns lists into Chrome rulesets and bundles the extension |
| `scripts/lists.ts` | Builds the real blocklists from `../packages/blocklists/sources.json` |
| `tests/unit`, `tests/e2e` | Vitest and Playwright tests |

## Things that will trip you up

- **The service worker sleeps.** Keep no state in memory. Blocking and Safe Search are Chrome
  rulesets and work while it sleeps; the timer saves timestamps to `chrome.storage.local`.
- **Branded Chrome and Edge ignore `--load-extension`.** The e2e tests use Playwright's
  Chromium, installed into `.browsers/` (it will not start from its default folder on the
  development PC).
- **Test builds** (`dist-e2e`, `dist-test`, `dist-hooks`) always use the fake lists. Only
  `dist-hooks` and `dist-test` contain the test-only activity switch (`LG_TEST`).
- **Every permission is explained in `../docs/PERMISSIONS.md`.** Add a row there before adding
  one to `static/manifest.json`.
