# Blocklists

Shared rule data for every Lumio Guard client (Chrome extension now, Android app later).

- `categories.json` — the category ids, names and defaults.
- `test/<category>.txt` — fake `.test` domains used for development and automated tests.

Real lists will live in `sources/<category>/` with a `SOURCE.md` per list recording where
it came from, its licence, the date pulled and the review done. Do not add a list without
that record (handoff §11).
