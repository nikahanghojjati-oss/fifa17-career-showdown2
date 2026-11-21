# TEST-HUNT-A08-1 · Biggest Showdown win names one manager on a tie

- Job: JOB-1818
- Card: CARD-HUNT-A08-1.md
- Outcome: TEST ONLY — confirmed failing regression; runtime fix deferred under the job's one-file rule.
- PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/857 (draft)
- Branch: `gameplay/work-1818-biggest-showdown-tie`
- Base: `gameplay/bug-list-1` at `2f3865feca484223ac7d267d83a9c4828bad3078`
- Commit SHA: `f9db71a7f99fbc713e948685818e5e6dbb241e87` (confirmed on GitHub and at the branch ref)
- Fixed: no
- Test: `tests/contracts/sweep-biggest-showdown-tie-contracts.cjs`
- Registration: appended to POS20 supplemental registry and operations expected-contract list.

## Findings

Both Node and browser VM reproduce the inconsistency. In Daniel-first history the career summary says `Daniel by 1`; in reversed history it says `Nik by 1`. Trophy Room correctly reports a shared one-point record in both cases. The career model also keeps a sole Showdown reference instead of null.

The contract has 14 tests: 8 pass, 6 fail as intended. Passing controls cover a single completed win with its reference, a unique larger five-point Daniel win, the tied maximum margin and the shared Trophy Room record. Failing expectations cover shared manager credit, null single-winner reference and `Shared · 1` career summary.

The smallest complete fix described by the card touches both `js/sharedCareerAnalytics.js` and `js/careerScreenSeam.js`. JOB-1818 step 3 authorizes an implementation only for a size-S fix confined to one named file; this draft therefore contains only the failing contract plus required registration.

## Check results on the published tree

- `node tests/contracts/sweep-biggest-showdown-tie-contracts.cjs`: exit 1, 14 tests / 8 pass / 6 fail.
- `node scripts/pos10-syntax.mjs`: POS10 syntax: 352 active source files, 0 failures.
- `npm run -s test:contracts`: exit 1; POS10 selected deterministic census failed in 1/192 contract(s): only sweep-biggest-showdown-tie-contracts.cjs. All 191 existing contracts pass.
- `npm run -s test:ops`: 73 tests / 73 pass / 0 fail.
- `node tests/contracts/final-polish-presentation.cjs`: Accessibility and presentation budgets passed for 1.9.1-r75: 159100 raw / 37484 compressed initial bytes; 4845 lazy feedback bytes.
- `git diff --check`: pass.

Initial census execution found missing local `tar-fs`; installed locked development dependencies with `npm ci --ignore-scripts --no-audit --no-fund` and reran the complete census. The final result above contains only the intended new regression failure. No existing assertion was weakened; runtime and startup files are unchanged.

Draft remains deliberately failing and not merge-ready.
