# Audit: js/sparkSharedSeasonCommit.js, second half (lines 59-115)

Job 1514 · Queue item 0096 · Read on factory/gameplay-v1 @ 986c7a1e1 (the file on qa/mega-audits differs; the active gameplay line was audited).

## Findings

no findings

## Riskiest places checked (no finding)

- Lines 65, 70 and 79: the hard-coded results runtime `"1.9.1-r9"` and commit `RUNTIME_REVISION` `"1.9.1-r10"` match the declared constants in js/sharedSeasonResults.js (line 8) and js/sharedSeasonCommit.js (line 8). They are duplicated rather than read from the module, so a future bump in either module will break reads with SEASON_COMMIT_RESULTS_NOT_READY. Maintenance risk only, not a current bug.
- Lines 81 and 84: `JSON.stringify` comparison of stored and ready results, and the receipt rebuild. Both sides are read back from Firestore and cloned, so the key order matches.
- Lines 99-103: the write is skipped on an idempotent replay (`if(!applied.idempotent)`), so a double tap or a retried operation cannot write twice.
- Lines 62-63: setup is rebuilt from the ledger for each command. Revision 6 and the 6 operation entries are checked. The authority object still uses an expiry of `Number.MAX_SAFE_INTEGER` and `nowEpochMs:0`, the same gap as first-half Finding 1 (sparkSharedSeasonCommit-1.md).
