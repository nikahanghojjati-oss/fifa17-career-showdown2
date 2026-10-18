# TEST-HUNT-B10-1 · Career Statistics and Trophy Room live refresh

- Job: JOB-1818
- Card: CARD-HUNT-B10-1.md
- Draft PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/860
- Branch: `gameplay/work-1818-online-career-live-refresh`
- Base: `gameplay/bug-list-1` at `2f3865feca484223ac7d267d83a9c4828bad3078`
- Commit SHA: `ebada1276f01ae1f311f152802bfb1b929efbd6a` (confirmed on GitHub)
- Fixed: **yes**
- Contract: `tests/contracts/sweep-online-career-live-refresh-contracts.cjs`

## Before / after

On the unchanged base, the new contract exits 1. Career Statistics and Trophy Room each fail “cache publication must invalidate the mounted frame (3 -> 4)”; the mixed supplied/shared-model case also fails. The four guard/identity cases pass.

After the six-line fix in `js/careerScreensV10.js`, all seven checks pass. A shared-cache publication redraws only mounted online screens without a supplied model and with a cache for the current context. No provider reload is triggered by the event. Account-switch reloads and supplied models remain protected.

## Checks

```text
PASS online career live refresh contracts: 7 checks.
POS10 syntax: 352 active source files, 0 failures
PASS POS10 selected deterministic census (192/192 current blocking contracts: frozen POS10 floor + POS20 supplements).
operations: 73 tests, 73 pass, 0 fail, 0 skipped
Accessibility and presentation budgets passed for 1.9.1-r75: 159100 raw / 37484 compressed initial bytes; 4845 lazy feedback bytes.
```

The first full-contract run encountered missing `tar-fs` for two existing browser contracts. After installing the existing lockfile dependencies with `npm ci --ignore-scripts`, the complete run passed. No dependency file changed.

The published tree `e6e558f210d819947be6ebee592d21e17278139f` matches the tested local tree. The regression proof uses the real cache loader and event publisher in a deterministic VM with an in-memory provider fixture; no manual two-account browser proof or production deployment is claimed.
