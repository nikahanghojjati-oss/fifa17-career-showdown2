# Status · JOB-17 · Simultaneous result taps: loser gets "stale"

State: IN PROGRESS
Step: 2 of 5
Updated: 2026-10-02 20:32 UTC
Chat: GPT-5.6 Sol normal chat
Code branch: gameplay/job-17-results-race
Head commit: 781406183800199be0eb4817169152c94073dd62
PR:
CI run:

## Notes
- Step 1: JOB-02 is merged via PR #318 (merge 4491e36378446b3a06ff2d28aa861bb892d87357). The JOB-17 branch exists and was created at the current gameplay/recovery-v1 head 60330715275c3ac96ea0bd1972fb8a0daa438c8d. No branch-specific Validate Gameplay Fast run exists yet on this newly created ref; the known JOB-02 race failure on recovery was `{"ok":false,"code":"permission-denied"}` for the simultaneous publish loser. The first JOB-17 test commit will create the branch CI baseline.

- Step 2: Added and registered `tests/contracts/shared-season-results-race-contracts.cjs` for stale race loser, re-read-denied stranger, and own-operation replay. Before the fix, exact-head CI failed as required: `actual {ok:false,code:"permission-denied"}` vs `expected {ok:false,code:"SEASON_RESULTS_STALE_BASE_REVISION"}`; Product contracts reported `shared-season-results-race-contracts.cjs: exit 1`.

## Self-check

## Blocked question
