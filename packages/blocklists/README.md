# Blocklists

Shared rule data for every Lumio Guard client (Chrome extension now, Android app later).

- `categories.json` — the category ids, names and defaults.
- `test/<category>.txt` — fake `.test` domains used for development and automated tests.

- `sources.json` — upstream lists, pinned to an exact revision and checksum.
- `curated/` — our own lists: Nigerian betting sites, and the never-block safety list.
- `SOURCES.md` — where each list comes from, its licence and the review still needed.
  Do not add a source without a row there (handoff §11).
- `real/` — built by `npm run lists` in `extension/`. Not committed.
