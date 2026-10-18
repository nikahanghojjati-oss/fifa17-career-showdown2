# Status · JOB-17 · Simultaneous result taps: loser gets "stale"

State: DONE
Step: 5 of 5
Updated: 2026-10-02 20:37 UTC
Chat: GPT-5.6 Sol normal chat
Code branch: gameplay/job-17-results-race
Head commit: b9ec7626fd8b487e2c488dfed6f934ae57b0e4e3
PR: #321
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37061275713

## Notes
- Step 1: JOB-02 is merged via PR #318 (merge 4491e36378446b3a06ff2d28aa861bb892d87357). The JOB-17 branch exists and was created at the current gameplay/recovery-v1 head 60330715275c3ac96ea0bd1972fb8a0daa438c8d. No branch-specific Validate Gameplay Fast run exists yet on this newly created ref; the known JOB-02 race failure on recovery was `{"ok":false,"code":"permission-denied"}` for the simultaneous publish loser. The first JOB-17 test commit will create the branch CI baseline.

- Step 2: Added and registered `tests/contracts/shared-season-results-race-contracts.cjs` for stale race loser, re-read-denied stranger, and own-operation replay. Before the fix, exact-head CI failed as required: `actual {ok:false,code:"permission-denied"}` vs `expected {ok:false,code:"SEASON_RESULTS_STALE_BASE_REVISION"}`; Product contracts reported `shared-season-results-race-contracts.cjs: exit 1`.

- Step 3: Updated only `ssrpPublishResult` in `js/sparkSharedSeasonResults.js`: on a denied publish transaction it re-reads the public season result once, maps a newer revision to STALE, retries exactly once for an already-recorded own operation, and otherwise preserves the original denial. Exact-head Product contracts: `PASS shared season results race contracts: stale loser, denied stranger, idempotent replay.`

- Step 4: Exact-head Validate Gameplay Fast run 37061275713 completed SUCCESS on b9ec7626fd8b487e2c488dfed6f934ae57b0e4e3. Gameplay contracts and Operations audit passed; Composed Rules emulator job passed Shared Setup, Transfer recovery, Gameplay lifecycle, Terminal Close, persistent pair, and the Two-manager journey.

- Step 5: Opened PR #321 into `gameplay/recovery-v1`; no Codex review required. Done checklist completed below.

## Self-check
- PASS — Contract fails on old code and passes on new code: old exact-head output was `actual {ok:false,code:"permission-denied"}` vs expected `SEASON_RESULTS_STALE_BASE_REVISION`; new exact-head output says `PASS shared season results race contracts: stale loser, denied stranger, idempotent replay.`
- PASS — Validate Gameplay Fast is green on exact head `b9ec7626fd8b487e2c488dfed6f934ae57b0e4e3`, run 37061275713; the Two-manager journey step passed.
- PASS — Recovery comparison shows exactly four changed files: `js/sparkSharedSeasonResults.js`, `tests/contracts/shared-season-results-race-contracts.cjs`, `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json`, and `tests/operations/pos20-control-plane.test.mjs`.
- PASS — Contract case (b) preserves the original `permission-denied` when the stranger's fresh public re-read is also denied.

## Blocked question
