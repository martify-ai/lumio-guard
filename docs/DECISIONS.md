# Lumio Guard — Decisions Log

Read this after `LUMIO_GUARD_Claude_Code_Engineering_Handoff.md`. It records what the
product owner has decided, the temporary defaults in use, and conflicts found between
the Notion documents. Update it whenever a decision changes.

## The mission (do not narrow it)

Lumio Guard is a protection **and** wellbeing product for young people:
**Protect · Understand · Interrupt · Redirect · Grow** (Notion 01 and workspace home).
Pornography and betting are only the first categories the Protect pillar blocks. Other
harmful categories, the 15/30/60 wellbeing interventions, healthy redirection and
habit growth are equally part of the product.

## Decided by the product owner

| Date | Decision |
|---|---|
| 2026-11-08 | Build the computer (desktop Chrome) extension first. Phones follow. |
| 2026-11-08 | Phones matter most for reach. Planned path: (A) a free "Private DNS" setup guide for Android families early, (B) a Lumio Guard Android app, (C) iPhone later. Keep rule lists and copy reusable so the Android app can share them. |
| 2026-11-08 | Gambling/betting is a launch category alongside adult content. Free lists miss many Nigerian betting sites, so we curate a Nigeria list too. |

## Temporary defaults (change only with product-owner approval)

| Topic | Default |
|---|---|
| First browser | Chrome, desktop |
| First test audience | Self-directed young people (via churches / youth groups). Guardian mode is v1. |
| Session ends after | 5 minutes with no activity (Technical Build Plan) |
| Rule precedence | Safety blocklist wins. Guardian allowlist arrives in v1. |
| Faith mode | Off by default, isolated from protection |
| Block page | Plain mode by default (Chrome's own "blocked" page, minimal permissions). Friendly Lumio page is optional and asks for "all sites" access with a clear explanation. See `PERMISSIONS.md`. |
| 60-minute prompt | No lockout in v0 |
| Fonts in extension | System fonts. v0 must make zero network calls, so no Google Fonts. |

## Safe Search (Milestone 2) — choices made, open to change

| Topic | Choice | Why |
|---|---|---|
| Engines covered | Google (187 country sites), Bing, DuckDuckGo, YouTube | The Build Plan named Google, Bing, YouTube. DuckDuckGo added: one simple, documented setting (`kp=1`). Yahoo, Yandex, Brave Search and others are NOT covered. |
| Google setting | `safe=active` | The Build Plan said `safe=strict`; `active` is the value Google documents. Not yet confirmed against live Google results by a person. |
| YouTube level | `Strict` | Safest default for young people. It hides comments and many ordinary videos. `Moderate` is the alternative; make this a guardian setting later. |
| Site access | Asked at install, only for the search/YouTube sites | The Build Plan wants Safe Search on by default. The cost is an install warning listing those sites. |
| Uncovered search engines | Left reachable | Blocking every other search engine would over-block. Revisit as an optional "only allow safe search engines" setting. |

## Real blocklists — choices made, open to change

| Topic | Choice | Why |
|---|---|---|
| Sources | Block List Project (Unlicense) + Sinfonietta (MIT) + our own Nigerian betting list | Licences clearly allow use in a product that is sold. Details in `packages/blocklists/SOURCES.md`. |
| Size | Full lists: 1.29 million domains, 51 MB | Coverage matters more than download size for protection. A `compact` profile exists (`npm run lists -- --profile compact`). |
| Trimming by popularity | Not done | The popularity lists we found carry non-commercial terms. |
| HaGeZi (GPL-3.0) | Not used yet | Needs a product-owner decision. It is the best replacement for the Block List Project, which was archived in October 2026 and will go stale. |
| Never-block list | 61 school, health, faith, news and government sites can never be blocked | Over-blocking is a serious defect (handoff §11). |
| Real lists in git | Not committed; rebuilt from pinned, checksummed sources | Keeps a catalogue of adult sites out of the repository and makes provenance exact. |
| Updates | None yet: the lists are a snapshot | Updatable rule packages arrive with v1. |

## Break reminders (Milestones 4–6) — choices made, open to change

| Topic | Choice | Why |
|---|---|---|
| What is counted | All active time in this browser, not time per site | Needs no access to browsing addresses. Cost: schoolwork counts the same as entertainment. Sorting time by type of site would need address access; revisit with real users. |
| "Active" means | A Chrome window is in front AND (keyboard/mouse used in the last 60 seconds OR the front tab is playing sound) | Counts watching videos; does not count music playing behind another program, a locked screen, or time away. |
| Session ends | After 5 minutes without activity (Build Plan) | |
| Reminders | 15 / 30 / 60 minutes, changeable in Settings (1–600, rising). Each shows once per session. | Hypotheses to test with real young people. |
| Where the reminder shows | A small card on the page on YouTube, TikTok, Instagram, Facebook, X/Twitter; a normal notification everywhere else | Avoids asking for access to every website. |
| At 60 minutes | Firmer wording, still no lockout | Build Plan. Doc 11's guardian-controlled restriction is left for v1. |
| What is stored | Per day, for 7 days: minutes active, reminders shown, breaks taken. Numbers only. | "Understand" pillar without browsing history. |
| Break ideas | 12 ideas in `packages/activities`, three shown at a time. No faith ideas yet. | Faith mode is optional and comes later, in its own file. |
| Known gaps | Windows may hide notifications (Focus Assist / Do Not Disturb). Reminders do not show in Incognito unless allowed. The timer can be up to a minute late. | |

## Conflicts found in the Notion workspace (2026-11-08)

1. **MVP scope.** PRD §8 and doc 06 put guardian accounts, sync and dashboard in the MVP.
   The Technical Build Plan and the handoff move them to v1. → Following the Build Plan.
2. **Duplicate numbering.** Short outline pages (e.g. "20 — Browser Extension Architecture")
   duplicate full specs (e.g. "16 — Browser Extension Architecture & Implementation
   Specification"). Six pages (Build Plan, Privacy Notice, 15, 16, 17, 20, 21, 22, 30) are
   not linked from the workspace home page. → Needs a clean-up in Notion.
3. **Reminder overlay on all sites.** The Build Plan injects a content-script overlay on every
   page and tracks time per domain. That needs "read and change all your data on all
   websites". → Proposed instead: count total active browsing time without URLs; keep
   counting while a tab plays audio; request host access only for a short list of
   entertainment sites and show the overlay only there. (Milestone 4–5 decision.)
4. **Blocklist size vs Chrome limits.** Build Plan suggests Steven Black's lists without a
   licence/size check. One major adult list has ~953,000 domains; Chrome guarantees 30,000
   static rules per extension. → Milestone 1 measures how many domains fit per rule.
5. **Law named in the Privacy Notice draft.** It cites the NDPR. Nigeria now applies the
   Nigeria Data Protection Act 2023 plus the GAID 2025 (in force 19 Sept 2025); under-18s are
   children and need guardian consent and age-verification. → Fix before v1.
6. **60-minute behaviour.** Doc 11 allows guardian-controlled restriction at 60 minutes; the
   Build Plan says no lockout. → No lockout in v0.
7. **Idle vs video.** Chrome's idle signal treats someone watching a video without touching
   the keyboard as idle, so the timer would miss passive watching. → Use the tab's
   "playing audio" state as an activity signal (no URL needed).

## Open questions (not yet decided)

- Real blocklist sources, licences and update cadence (after Milestone 1).
- Data retention periods (before v1).
- Guardian visibility boundaries and consent/onboarding model (before v1).
- Launch age range and Nigeria legal review (before v1).
