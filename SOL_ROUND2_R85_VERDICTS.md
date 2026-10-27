# Sol 6.1 round 2 (r85 live): Claude's verdicts

Reviewed main `076177e2`. Report dated 2026-10-27 13:39 Boston. Every item below was checked against the live code at that SHA. Fixes land in **r86**, since main only changes on the owner's "merge rNN".

| ID | Finding | Verdict | Plan |
|---|---|---|---|
| S61-r85-04 (P2) | Cold History times out as the career grows. `LOAD_TIMEOUT=15000` (`js/rivalryLegacyV10.js:69`) races the whole career load. The loader reads 3 Showdowns at a time (`COLD_READ_LIMIT=3`), 4 documents per season, so 100 ten-season Showdowns need 4,201 gets and show "unavailable" | **Accepted** (verified in code) | r86, part of the owner's reads-at-scale goal. (1) The deadline becomes an inactivity deadline: it resets while verified Showdowns keep arriving, and shows truthful progress, never partial totals as complete. (2) Measure 10/30/100, then decide on an immutable, rebuildable per-Showdown summary to cut the cold cost. Acceptance as Sol wrote it |
| S61-r85-02 (P2, test) | The CE2PG career-page oracle compares raw rendered label casing | **Accepted** | r86: compare parsed numeric career fields, with a mutation negative control (one point, win or trophy changed must fail) |
| S61-r85-01 | Season 4 host-confirmation observation, no root cause | **Deferred** (watch) | Not reproduced in 467-check and 248-check runs. Keep the trace. If it appears in r86 Gate or CE2PG runs, root-cause it then |
| S61-r85-03 | Home decoration overlap waiver in the short-screens audit | **Kept as approved** | Listed decorative items only; the owner's rule targets content covering content. Revisit if the owner asks |
| F06 | `seal` not required on protect-main | **Accepted (owner step)** | Owner adds it this evening |
| F07 | `NEXT_TASK.md` and `POS20_CURRENT_STATE.json` still say r84 is live | **Accepted** | r86 updates both to "r85 live, r86 in work" |
| Reads at scale | 2 cold device visits at 100 ten-season Showdowns use 8,402 gets (about 23,500 billed under the 2.8 estimate); a one-minute Results wait costs 21 reads | **Accepted as r86 input** | Feeds the r86 reads-at-scale ceiling test (10/30/100 Showdowns, cold/warm/reload, both devices) |
| Old saves / Marquee Player boundary | Keep MP out of hashed result/commit/ledger documents; explicit allowed shape; safe defaults; adapter-level defaults so a missing field never makes a screen unavailable | **Accepted as r86 design rules** | MP is stored as separate display metadata, never in the hashed protocol documents; a dated fixture per r80 to r85 revision is added to the old-saves test |
| #1022 prompt | The rules-vs-app area names only the first Rules build stage | **Accepted** | r86: point the prompt at the composed artifact (`composeCandidate()`) |
| Brief §6.2 | "Persistent-pair writes do not check liveness" is too broad: partner create/update/inbox call `activeActor()` | **Accepted (brief corrected)** | Next brief says pair links and abandon only |

No P0 or P1 defects were found. Scores: behaviour 8.5, data safety 8.5, server authorization 9.0, tests 8.0, maintainability 7.5, resource predictability 7.0, release and governance 8.0, interface 8.0.
