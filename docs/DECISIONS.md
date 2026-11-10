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
