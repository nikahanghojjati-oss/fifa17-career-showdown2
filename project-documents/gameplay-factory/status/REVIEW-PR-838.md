# Review PR 838 — JOB-1804 (Shared Setup Rules refusal)

| Check | Result | Evidence |
| --- | --- | --- |
| A. Reproduced first | PASS | PR Evidence: unchanged-base CE2PG reports `evaluation error at L2800:26 for 'update'`; base also shows the account/device/rivalry/session verify entries. |
| B. Cause named and verified | PASS | PR quotes `js/sparkSharedShowdownSetup.js:170-173`: `transaction.get(refs.account)`, `transaction.get(refs.device)`, `transaction.get(refs.rivalry)`, `transaction.get(refs.session)`; all four lines are present on `gameplay/bug-list-1`. |
| C. New test fails then passes | PASS | New `tests/contracts/shared-setup-transaction-reads-contracts.cjs`; PR shows base assertion including four authority reads versus expected ledger-only read, followed by eight setup cases and overall PASS on the fix. |
| D. Only allowed files | PASS | Exactly four changed files: `js/sparkSharedShowdownSetup.js`, new setup-transaction contract, `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json`, and `tests/operations/pos20-control-plane.test.mjs`; these are the job's provider, new test, and two registration files. |
| E. No forbidden change | PASS | Provider diff only separates authority reads from the writing transaction (`js/sparkSharedShowdownSetup.js:177-211`); operations test change only registers the new contract, without editing an existing assertion. No Rules, visuals, timers, sessionStorage, or forbidden paths changed. |
| F. Logic is right | PASS | `js/sparkSharedShowdownSetup.js:203-243` preflights account/device/rivalry/session, then re-reads authoritative ledger inside the writing transaction; its replay and `baseRevision` checks handle retries and a partner ahead/behind, while the unchanged Rules recheck authorization if it changes. Reload reconstructs ledger; solo does not use this shared-setup provider. No wrong-result input established from the diff; concurrent authority revocation should reject on server write. |
| G. Required checks pasted and PASS | FAIL | PR shows passing syntax, contracts (192/192), ops (73), budget, startup, and three setup browser audits, but `shared-showdown-paired-first-entry-audit.cjs:138` times out; CE2PG ends `FAIL ce2pg-3-1: 405/433 checks, 28 problem(s)` despite removal of L2800. |

**Verdict: NEEDS FIX**

Notes:
- Resolve or formally rebaseline the failing paired-first-entry screen audit without weakening an existing test.
- The 3-season shared Showdown finishes and L2800 goes to zero, but 28 remaining CE2PG checks still fail; they must be cleared or explicitly adjudicated before approval.
- The requested complete per-season traffic budget was not available from the harness network report; only setup-path reads/writes were measured.
- No PR comment, source-branch push, or merge performed.
