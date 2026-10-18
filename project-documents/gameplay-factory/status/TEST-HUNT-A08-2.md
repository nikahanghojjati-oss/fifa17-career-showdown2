# TEST-HUNT-A08-2 · Level Career Table gives Nik second place

- Job: JOB-1818
- Card: `CARD-HUNT-A08-2.md`
- Result: **TEST ONLY — confirmed bug**
- PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/858 (draft)
- Branch: `gameplay/work-1818-career-table-level-rank`
- Base: `gameplay/bug-list-1` at `2f3865feca484223ac7d267d83a9c4828bad3078`
- Commit SHA: `66e6e0fb1a8233939aed8f1c555f10181e475caa` (confirmed on GitHub branch ref and PR head)
- Fixed: **no**

## What was saved

New `tests/contracts/sweep-career-table-level-rank-contracts.cjs`, appended last to `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json` and registered with a const declaration and final `expectedSupplementalContracts` entry in `tests/operations/pos20-control-plane.test.mjs`.

No runtime file or existing product contract changed. The existing seam contract explicitly expects the wrong tied rank; the card requests changing it, but JOB-1818 step 5 prohibits editing existing tests. This draft therefore preserves a failing regression for the later fix.

## Reproduction adjustment

The card's literal two-Season setup throws `HISTORY_CONVERGENCE_SETUP_INVALID`: valid lengths are 1, 3, 5 and 10. The saved test uses a completed three-Season Showdown: 7–5, 5–7, then 0–0. Both managers still have exactly 12 career points and one Season win, with both standings marked `level: true`.

## Evidence

`node tests/contracts/sweep-career-table-level-rank-contracts.cjs` exits 1 on the base runtime:

```text
PASS the completed fixture has exactly 12 points and one Season win per manager
PASS Node: unique leaders retain first and second place
PASS Node: Team V keeps both tied managers ranked #1
PASS browser VM: unique leaders retain first and second place
PASS browser VM: Team V keeps both tied managers ranked #1
AggregateError: Career Table level-rank contracts: 2 failed; 5 passed.
```

Both failures report the same exact difference: actual `2. Nik (level)`, expected `1. Nik (level)`. Daniel's label and both point/win strings are correct. Team V's active Trophy Room stays `#1` / `#1`.

| Check | Result / last line |
| --- | --- |
| Node syntax for the new contract | Pass |
| Five registered routing paths | PASS level-rank contract routing (5/5 paths). |
| `node scripts/pos10-syntax.mjs` | POS10 syntax: 352 active source files, 0 failures |
| `npm run -s test:ops` | 73 tests; 73 pass; 0 fail |
| `node tests/contracts/final-polish-presentation.cjs` | Accessibility and presentation budgets passed for 1.9.1-r75: 159100 raw / 37484 compressed initial bytes; 4845 lazy feedback bytes. |
| `npm run -s test:contracts` | Initial run: 188/192 pass; new regression fails intentionally, three existing browser contracts blocked by missing tar-fs |
| Targeted rerun after `npm ci --ignore-scripts --no-audit --no-fund` | PASS POS10 selected deterministic census (3/192 current blocking contracts: frozen POS10 floor + POS20 supplements). |
| `git diff --check` | Clean |

All 191 existing contracts pass across the full run and dependency-corrected targeted rerun. Only the new regression remains red. The remote commit's tree `7fab1108c7de79fafa1e1a7032bcdebded781b88` exactly matches the tested local tree.
