# Career Mode Showdown — Candidate C Implementation Log

Date: 2026-08-12
Status: ACTIVE companion log to `CAREER_MODE_SHOWDOWN_CANDIDATE_C_ROLLING_HANDOFF_2026-08-12.md`
Branch: `agent/candidate-c-atomic-restore`
Draft PR: `#24`
Base `main`: `6b49a7987ff2251f008af92eee31bdf8f734d6ee`
Protected released runtime: `29760bbf33c974267bd1ad64d0839f73ad8051fa`

## Checkpoint 1 — storage transaction first implementation

The first implementation deliberately started below the UI layer. `js/storage.js` received an all-or-nothing raw multi-key transaction implementation and `tests/contracts/restore-storage-contracts.cjs` injected first/middle/final write failures, quota-like failures, verification mismatch, rollback failure, raw absence, no-op and snapshot-read failure.

The dedicated Candidate C workflow passed on the first implementation. Therefore the core rollback/verification semantics were sound enough for deterministic contract testing.

However two existing permanent gates failed:

- Validate Static App run `31622580805`;
- Validate Final Polish run `31622580625`.

Both failures were the same real product regression, not test noise:

`Startup budget exceeded: 171362 > 165000.`

The protected v1.1.3 baseline had been `164,965` raw bytes. Putting the complete transaction engine into eager `js/storage.js` added roughly 6.4 KB to the initial shell.

Classification: application/performance architecture defect.

Rejected responses:

- do not raise the `165,000` raw ceiling;
- do not weaken Final Polish/Static App;
- do not make Candidate C permanently eager just because restore is safety-critical;
- do not move browser-storage ownership to a lazy module to save bytes.

## Checkpoint 2 — authority/performance reconciliation

The correction distinguishes storage ownership from algorithm location.

`js/storage.js` remains the only browser-storage owner and the only canonical restore entry point. It still owns:

- real `localStorage` reads;
- real writes/removals;
- error reporting;
- exact raw value/absence I/O;
- post-success cache/preference synchronization.

The heavy transaction state machine moved to new lazy pure module:

`js/storageTransaction.js`

The lazy engine:

- contains no `localStorage` reference;
- contains no `currentShowdown` dependency;
- knows only the logical canonical names `activeShowdown`, `legacyShowdowns`, `preferences`;
- receives an ephemeral read/write adapter from `js/storage.js`;
- performs deterministic snapshot, commit, verify, rollback and rollback-verify sequencing;
- never updates application caches or route state itself.

This preserves both locked architecture requirements:

1. `js/storage.js` remains the sole persistence authority;
2. Candidate C remains lazy and does not force a startup-budget increase.

To make room for the small storage-owned bridge without changing runtime behavior, the existing eager `js/storage.js` implementation was compacted substantially. This is a source-size/formatting optimization rather than a feature removal.

## Checkpoint 3 — corrected foundation proof

Corrected branch head tested: `24a07136e4055863e84f2394b1d9ef7cd789a17f`.

The dedicated Candidate C workflow passed:

- Validate Candidate C Atomic Restore run `31623070456` — success.

Existing permanent gates that had failed on the eager implementation now pass:

- Validate Static App run `31623070416` — success;
- Validate Final Polish run `31623070393` — success.

Static App measured the corrected eager shell at:

- raw: `162,950` bytes;
- gzip: `36,996` bytes;
- eager local JS files: exactly `7`;
- local eager stylesheets: exactly `1`.

Therefore Candidate C now has approximately 2,050 raw bytes of headroom under the unchanged 165,000 ceiling, compared with only 35 raw bytes on the released v1.1.3 source formatting.

The improvement does not come from weakening the budget. It comes from keeping the restore transaction engine lazy and making the already-eager storage authority more compact.

Static App also re-proved:

- JavaScript syntax;
- locked scoring/navigation state matrix;
- 98-club identity/reveal contracts;
- seven-script startup shape;
- no direct `localStorage` leak outside `storage.js`/diagnostics;
- no route-history leak outside `screens.js`;
- no global classic-script function collision;
- Chromebook and Home presentation guards.

## Current implementation state

Implemented/proven so far:

- storage-owned canonical raw transaction entry point;
- lazy pure transaction state machine;
- exact raw snapshot/absence semantics;
- deterministic active → Legacy → preferences order;
- exact post-write verification;
- rollback attempts over the complete affected-key set;
- exact rollback verification;
- explicit `rollback-failed-critical` result;
- idempotent/no-op raw transactions;
- cache/preference synchronization only after successful full verification;
- deterministic failure-injection contracts;
- dedicated Candidate C CI lane;
- protected startup budget preserved.

Not implemented yet:

- restore choice model;
- Legacy deterministic merge planner;
- fresh Apply-time Candidate B reanalysis orchestration;
- user-facing Apply/Recovery UX;
- active `currentShowdown` synchronization after successful restore;
- post-success route resolution through `js/screens.js`;
- browser/a11y/touch/reduced-motion restore audit;
- release version/revision change.

Candidate C remains incomplete and PR #24 must remain draft.

## Next engineering step

Build a lazy restore planner/orchestrator on top of Candidate B analysis and the now-proven storage transaction foundation.

The planner must remain pure until Apply and must map Candidate B categories into explicit deterministic choices. In particular, same-ID/different-content local-vs-backup Legacy records require an owner/user-selected resolution; no implicit `newer wins` policy is authorized.

Before any first canonical write, Apply must:

1. acquire the in-flight lock;
2. flush pending application writes;
3. rerun `analyzeCareerModeBackupFile(selectedFile)` from the actual selected File;
4. validate the refreshed analysis and all required choices;
5. compute the complete final canonical raw values in memory;
6. then call the storage-owned transaction boundary.

No navigation/cache/currentShowdown refresh is legal until that transaction returns verified success.
