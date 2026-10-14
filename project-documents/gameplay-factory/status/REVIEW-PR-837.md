# Review PR #837 — JOB-1803
PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/837
Base: `gameplay/bug-list-1` (`2f3865feca484223ac7d267d83a9c4828bad3078`)

| Check | Result | Evidence |
| --- | --- | --- |
| A. Reproduced first | PASS | PR shows new VM contract failing on unchanged base: extra transaction reads `accounts/manager_one`, `devices/...`, `sharedSetup/authoritative`, `seasonCommits/season_1` beyond the rivalry; same-base CE2PG reported `maximum of 1000 expressions`. |
| B. Cause named and confirmed | PASS | Confirmed base `js/sparkTerminalClose.js:41-46` exactly contains `transaction.get(references.account)`, `transaction.get(references.device)`, `transaction.get(references.setup)`, `transaction.get(references.commit(season))` in the progress writing transaction. |
| C. Test fails then passes | PASS | Added `tests/contracts/terminal-close-transaction-reads-contracts.cjs`; PR pastes baseline `AssertionError ... must read ONLY the rivalry` followed by 1/3/5/10-season, race, retry and budget PASS lines. |
| D. Only allowed files | PASS | Four changed files, all authorized: `js/sparkTerminalClose.js`, new terminal-close contract, `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json`, and `tests/operations/pos20-control-plane.test.mjs` (required registry append only). |
| E. No forbidden change | PASS | Diff changes only the specified close-path logic and mandated contract/registration entries; no existing test assertion altered, no visual, Rules, startup, timer, online poll, or sessionStorage edits. |
| F. Logic is right | PASS | `js/sparkTerminalClose.js:40-61`: read-only preflight prepares the next score; writing transaction reads only rivalry and compares `revision` and `contentHash`; mismatch retries preflight. `connectionState==="closed"` preserves replay/reload; partner ahead/behind is re-read without double-scoring (VM race/retry tests); solo has no shared terminal transaction and remains outside this shared-only call. |
| G. Checks pasted and PASS | PASS | PR pastes exit-0 syntax, 192/192 contracts, 73 ops, Firestore-budget, Reus Gate, and all three required browser audit PASS lines; 3-season CE2PG completed both CLOSED and `zz.rulesLimit` passed with **0** expression-limit writes. Overall CE2PG `405/433 FAIL` is from remaining baseline screen defects, not this targeted Rules-limit acceptance. |

**Verdict: READY FOR CLAUDE**

Notes:
- The new test uses a VM fake SDK and r75 cached read layer, so Claude should independently verify Firestore's read-only transaction/no-verify behavior before merge.
- Baseline 3-season CE2PG versus fixed: Rules expression-limit refusals 1 → 0; history 238/244 → 238/244.
- Full-journey successful Firestore reads were not instrumented; reported read reductions cover the isolated progress path only.
- No other close-path transaction was changed because the CE2PG evidence did not establish its refusal.
