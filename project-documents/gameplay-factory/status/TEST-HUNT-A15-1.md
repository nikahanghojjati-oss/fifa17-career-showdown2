# TEST-HUNT-A15-1 · Missing league points and goals count as zero

- Card: `CARD-HUNT-A15-1.md`
- Result: **TEST ONLY**
- PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/859 (draft into `gameplay/bug-list-1`)
- Branch: `gameplay/work-1818-missing-season-stats`
- Commit SHA: `d8961abd5eb5e92d73a425b279b0d62a7611775a` (confirmed as GitHub draft PR head)
- Base SHA: `2f3865feca484223ac7d267d83a9c4828bad3078`
- Fixed: **no**. Card requires both `js/sharedSeasonResults.js` and `js/sparkSharedSeasonResults.js`; JOB-1818 permits a fix only when it touches one named production file.

## Evidence

New registered contract: `tests/contracts/sweep-missing-season-stats-contracts.cjs`.

- Direct run: exit 1, 14 tests / 2 pass / 12 fail. Null/empty points and goals are wrongly accepted at the protocol, provider publication and private-result read boundaries. Provider tests verify no public/private Season Result documents should be written; private-read tests retain a real numeric-zero command hash. Passing controls cover numeric zero, 20-club maxima, no opponent private reads before reveal, and successful two-manager reveal.
- First protocol failure: `Missing expected rejection: leaguePoints=null must not become zero`.
- Provider failure: `leaguePoints=null must not write a public Season Result` (`true !== false`).
- Private-read failure: `leaguePoints=null must not be accepted as hash-valid zero` (`true !== false`).
- Syntax: `POS10 syntax: 352 active source files, 0 failures`.
- Operations: 73 tests, 73 pass, 0 fail, 0 skipped.
- Full contracts: `POS10 selected deterministic census failed in 2/192 contract(s):` the deliberate new regression and unchanged `season-entry-no-flash-contracts.cjs`; 190 other contracts pass. The unchanged failure also reproduces standalone at line 115: `decoded before the reveal` (actual false, expected true).
- Presentation budget: `Accessibility and presentation budgets passed for 1.9.1-r75: 159100 raw / 37484 compressed initial bytes; 4845 lazy feedback bytes.`
- Diff whitespace check: clean. Only the new contract and its required registry/operations-list additions are in the PR. Existing assertions and production code are unchanged.

No merge, deployment, production two-account observation, or SSJR/MDP credit claimed.
