# JOB-17 · Simultaneous result taps: the loser gets "stale", never "permission-denied"

| Lane | Depends on | Steps | Code branch | PR into | Codex review |
| --- | --- | --- | --- | --- | --- |
| **chat** (normal chat; every emulator run happens on GitHub CI, WORKER_HANDBOOK §7) | JOB-02 merged into `gameplay/recovery-v1` | 5 | `gameplay/job-17-results-race` | `gameplay/recovery-v1` | no |

## 1. Goal

Daniel and Nik can tap "publish result" for the same season at the same moment. Exactly one write wins. The loser must get `SEASON_RESULTS_STALE_BASE_REVISION`, so the app refreshes and lets them retry on the new revision. Today the loser sometimes gets `permission-denied` instead. The losing transaction's `set` on `rivalries/{id}/seasonResults/season_N` reaches the Rules after the winner has created the document, so the Rules evaluate it as an update from the wrong base revision and deny it. JOB-02's journey test (`tests/firebase/two-manager-journey-emulator.cjs`, about line 220) catches this on some CI runs. It passed 3 of 3 times locally and failed once on CI at `gameplay/recovery-v1` 4491e36.

## 2. Branches and files

- The lead creates `gameplay/job-17-results-race` from `gameplay/recovery-v1`. If it is missing, create it yourself from `gameplay/recovery-v1`.
- Edit: `js/sparkSharedSeasonResults.js`, in `ssrpPublishResult` only.
- Create: `tests/contracts/shared-season-results-race-contracts.cjs`. Register it in `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json` and append its constant to `expectedSupplementalContracts` in `tests/operations/pos20-control-plane.test.mjs` (about lines 66-70), the same way JOB-03 did.
- Never change the Rules, the journey test, or any other existing test. Never accept `permission-denied` in a test as a pass.

## 3. What to build

In `ssrpPublishResult`, when `runTransaction` fails with a permission-denied error (`code` is `permission-denied` or `firestore/permission-denied`), do one fresh, read-only check before returning. Read the public `seasonResults/season_N` document outside a transaction, using the same refs and helpers `ssrpRead` uses.

- If the document now exists and its `revision` is greater than the caller's `baseRevision`, return `{ok:false, code:"SEASON_RESULTS_STALE_BASE_REVISION"}`.
- If the caller's own `operationId` is already in `operationIds`, let the existing idempotent-replay path answer: call the transaction once more.
- Otherwise return the original error unchanged.

Never retry more than once. Never turn a permission-denied into `ok:true`. A stranger or wrong-role write must still return `permission-denied`.

## 4. Steps

1. Baseline: note the "Validate Gameplay Fast" result on the job branch head. The journey's race step may be red. Quote it.
2. Write the contract test first. It uses a fake `firebaseSdk` whose `runTransaction` throws `{code:"permission-denied"}` once, then serves a public doc at revision 1. Cover three cases:
   - (a) a race loser gets STALE;
   - (b) a stranger whose re-read is also denied still gets `permission-denied`;
   - (c) an own-operation replay returns the replay result.
   It must fail before the fix.
3. Make the fix in `js/sparkSharedSeasonResults.js`. Run the contract with `node`.
4. Push and wait for "Validate Gameplay Fast" on your exact head. It must be fully green, including the two-manager journey.
5. Open the PR into `gameplay/recovery-v1`, fill the status file and the Done checklist, then set State: DONE (WORKER_HANDBOOK §7a).

## 5. Done checklist (PASS/FAIL with one line of evidence each, in the status file)

- [ ] The contract test fails on the old code and passes on the new code (quote both).
- [ ] "Validate Gameplay Fast" is green on the exact head, including the two-manager journey.
- [ ] Only `js/sparkSharedSeasonResults.js`, the new contract test and the two registry files changed.
- [ ] A stranger or wrong-role write still returns `permission-denied` (contract case b).

## 6. When stuck

Set State: BLOCKED in the status file, quote the exact error, and ask one question.
