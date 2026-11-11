# Blocklist sources

Where every blocked domain comes from, and our right to use it (handoff §11).
The exact pinned addresses and checksums are in `sources.json`.

| Source | Category | Licence | Pinned revision | Domains | Notes |
|---|---|---|---|---|---|
| [The Block List Project](https://github.com/blocklistproject/Lists) — `porn.txt` | Adult | Unlicense (public domain; any use, including commercial) | `ee3bdba` (list dated 2026-07-20) | 953,197 | Project was **archived in October 2026**: no further updates. Marked "large". |
| [Sinfonietta hostfiles](https://github.com/Sinfonietta/hostfiles) — `pornography-hosts` | Adult | MIT © 2016 Sinfonietta (keep this credit) | `46f3097` | 61,153 | Smaller, hand-maintained. |
| The Block List Project — `gambling.txt` | Betting | Unlicense | `ee3bdba` | 342,623 | Many are mirror sites of a few big brands. Marked "large". |
| Sinfonietta hostfiles — `gambling-hosts` | Betting | MIT © 2016 Sinfonietta | `46f3097` | 2,690 | |
| `curated/gambling-nigeria.txt` | Betting | Ours | — | 63 | Hand-picked Nigerian and major international betting sites. **Needs human review before launch.** |

After merging, cleaning and removing duplicates (2026-11-10): **948,756 adult** and
**342,813 betting** domains.

## Checked and not used

| Source | Why not |
|---|---|
| HaGeZi DNS blocklists | GPL-3.0. Usable, but it places conditions on what ships with it. A product-owner decision. It is actively maintained, so it is the best candidate to replace the archived Block List Project. |
| Tranco / Cloudflare Radar popularity lists (to keep only well-known sites) | Built partly from data under a non-commercial licence (CC BY-NC). Not safe for a product that will be sold. |
| StevenBlack hosts (porn / gambling extensions) | MIT, but it re-packages other people's lists whose own terms we have not checked one by one. |

## Safety net: `curated/never-block.txt`

61 school, health, faith, news and government sites. If any upstream list contains one of
them (or a parent of one), the entry is removed when the lists are built, and the build
stops if one would still be blocked. On 2026-11-10 no upstream entry needed removing.

## Review still needed

- Nine curated betting sites are not in any upstream list, so they rest on our judgement
  alone: `babaijebu.ng`, `betbonanza.com`, `betland.com.ng`, `football.com`, `hallabet.com`,
  `lionsbet.com`, `lottomania.ng`, `supabets.com.ng`, `zebet.ng`. A person should open each
  once and confirm it is a betting site.
- Nobody has sampled the upstream lists for wrongly listed sites beyond the never-block check.
- The lists are a snapshot. There is no update process yet (handoff §11 asks for versioned,
  updatable rule packages; that arrives with v1's rule distribution).

## Rebuilding

```bash
cd extension
npm run lists                          # full profile
npm run lists -- --profile compact     # leaves out the two "large" sources
npm run build
```

Downloads are cached in `.cache/` and refused if their checksum does not match the pin.
The built lists (`real/`) are not committed to git.
