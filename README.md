# Lumio Guard

A digital protection and wellbeing product for young people, by Luminescent.
**Protect · Understand · Interrupt · Redirect · Grow.**

Current stage: **v0, Milestones 1–6** — a local-only Chrome extension that blocks known harmful
sites, keeps Safe Search on (Google, Bing, DuckDuckGo, YouTube Restricted Mode), counts active
browsing time, and shows gentle break reminders with a few ideas for what to do instead. It has
no account, no server and sends nothing anywhere.

## Folders

| Folder | What's in it |
|---|---|
| `extension/` | The Chrome (Manifest V3) extension |
| `packages/blocklists/` | Category list and blocklists, shared with future clients (Android app) |
| `docs/` | Handoff brief, decisions, permissions, capacity results |

Start with `CLAUDE.md`, then `docs/LUMIO_GUARD_Claude_Code_Engineering_Handoff.md`, then
`docs/DECISIONS.md`.

## Try it in Chrome

```bash
cd extension
npm install
npm run lists    # downloads and builds the real blocklists (first time: about 35 MB)
npm run build
```

Without `npm run lists`, the build uses fake `.test` sites only.

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose the `extension/dist` folder.
4. Visit `http://adult-example.test/` or `http://casino-example.test/`. Chrome shows a
   "blocked" page. `http://safe-example.test/` is not blocked (it just doesn't exist).
5. Search for anything on Google or Bing: the address gains `safe=active` / `adlt=strict`, and
   it comes back if you remove it. On YouTube, Restricted Mode is on and cannot be switched off.
6. To see a reminder quickly, open **Settings** and set the reminder times to 1, 2 and 3
   minutes, then keep browsing. On YouTube the reminder is a small card on the page; elsewhere
   it is a normal notification.
7. Click the Lumio Guard icon for the status pop-up, and **Settings** to switch groups on or off.

With the real lists built, well-known adult and betting sites show Chrome's "blocked" page.
Where the lists come from and their licences: `packages/blocklists/SOURCES.md`.

## Tests

```bash
cd extension
npm test                  # logic tests (domain cleaning, rule building, settings)
npm run browsers:install  # once: test browser into extension/.browsers
npm run test:e2e          # real-browser tests with the extension loaded
npm run spike:capacity    # how many domains fit (slow; results in docs/CAPACITY.md)
```

## What v0 does not do

- Work in other browsers, phone apps or on phones (see `docs/DECISIONS.md` for the phone plan).
- Catch sites that are not on its lists, or every explicit ad.
- Update its lists by itself. They are a snapshot from November 2026.
- Keep search safe on engines other than Google, Bing, DuckDuckGo and YouTube.
- Stop someone from turning it off in Chrome's extension settings.
- Measure total screen time. It counts active time in this browser only.
