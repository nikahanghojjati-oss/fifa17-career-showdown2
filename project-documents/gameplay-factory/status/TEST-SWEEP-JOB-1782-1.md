# TEST-SWEEP-JOB-1782-1 · JOB-1818

- Card: `CARD-SWEEP-JOB-1782-1.md`
- PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/850 (draft)
- Commit SHA: `a579446f97fd880836a5e13ad2659ad41e2fa258` (confirmed on GitHub)
- Branch: `gameplay/work-1818-season-score-key-order`
- Base: `gameplay/bug-list-1` at `2f3865feca484223ac7d267d83a9c4828bad3078`
- Fixed: yes
- Test: `tests/contracts/sweep-season-score-key-order-contracts.cjs`, registered as the last supplemental product contract and appended to operations expectations.

## Before / after

On the base the new contract exited 1 with:

```text
AssertionError [ERR_ASSERTION]: playerOne must read identical reordered scores: SEASON_COMMIT_RESULTS_REVISION_MISMATCH
false !== true
```

The one-line provider fix uses the existing recursive canonical serializer. After fixing, both managers' reads and the rival acknowledgement succeed when only the seven field keys are reordered. A genuine leaguePoints change from 100 to 99 still rejects both reads and acknowledgement without changing the stored commit.

```text
PASS Season score key order: both manager reads and rival acknowledgement accept identical reordered fields; real score drift rejects reads and writes without mutation.
POS10 syntax: 352 active source files, 0 failures
PASS POS10 selected deterministic census (192/192 current blocking contracts: frozen POS10 floor + POS20 supplements).
Operations: 73 pass, 0 fail, 0 skipped
Accessibility and presentation budgets passed for 1.9.1-r75: 159100 raw / 37484 compressed initial bytes; 4845 lazy feedback bytes.
```

Related shared-season-commit provider and production contracts passed. Startup size stays below the 37,495-byte limit. No existing test was loosened; no protected file, screen or timer was changed.

## Not done / unsure

The npm full-suite wrapper returned exit 1 with an incomplete log. After installing the locked dependencies, its exact underlying command `node tests/support/run-selected-product-contracts.cjs --all` completed all 192 contracts with exit 0, including the browser contracts. GitHub CI has not been assessed. No merge or deployment performed.
