# TEST-SWEEP-JOB-1780-1 · JOB-1818

- Card: `CARD-SWEEP-JOB-1780-1.md`.
- Draft PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/849
- Branch: `gameplay/work-1818-expired-season-results` → `gameplay/bug-list-1`.
- Commit SHA: `ec6e23fdbcb4fd87f4c1cd1df37f1d6d3e9416ea` (confirmed on GitHub branch head).
- Fixed: yes.
- Base: `2f3865feca484223ac7d267d83a9c4828bad3078`.
- Contract: `tests/contracts/sweep-expired-season-results-contracts.cjs`.

## Evidence

Before: the new contract exited 1 because read at exactly 10,000,000 ms returned `ok:true` instead of `SEASON_RESULTS_ACTIVE_SESSION_REQUIRED`. Its observations also confirmed both managers' read and publish paths accepted requests at 10,000,000 and 10,000,001 ms (eight expired requests).

After: the same contract exited 0. Both managers can read/publish at 9,999,999 ms; read/publish at 10,000,000 and 10,000,001 ms reject with the existing error code. Expired publish creates no public Results, private result or league projection, and leaves every stored document unchanged.

Fix: add `||now>=expires` to the existing rejection condition in `js/sparkSharedSeasonResults.js`. Registered the new test last in the POS20 supplemental registry and operations census. No existing test assertions changed.

Checks:
- `POS10 syntax: 352 active source files, 0 failures`.
- `PASS POS10 selected deterministic census (192/192 current blocking contracts: frozen POS10 floor + POS20 supplements).`
- Operations: 73 tests, 73 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo.
- `Accessibility and presentation budgets passed for 1.9.1-r75: 159100 raw / 37484 compressed initial bytes; 4845 lazy feedback bytes.`
- `git diff --check`: clean.

No merge or deployment. Production two-manager evidence is outside this job.
