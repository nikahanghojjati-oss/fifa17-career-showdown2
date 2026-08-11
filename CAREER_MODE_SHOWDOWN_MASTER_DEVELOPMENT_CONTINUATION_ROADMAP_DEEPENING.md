# Career Mode Showdown — Master Development Continuation — Roadmap Deepening

Last updated: 2026-08-11
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Branch for this pass: `agent/roadmap-handoff-deepening-r1`

Read order for a future session:

1. `00_DEVELOPER_START_HERE.md`
2. `NEXT_TASK.md`
3. `POST_V1_ROADMAP_EXECUTION.md`
4. this file for detailed reasoning/action chronology
5. older r5 handoff/addendum only when deeper visual history is needed

## 1. Owner request that created this pass

Owner message:

> Do a development on current roadmap to understand it more deeply and then make the room much more detailed and accessible to follow for next chat or work developer sessions

The owner had already established a standing requirement that implementation happens directly in GitHub and that development actions plus substantive chat decisions are continuously recorded for future developers.

Interpretation used:

- this is a roadmap/continuity development pass, not permission to begin a downstream feature prematurely;
- inspect the approved future roadmap against current source rather than writing another speculative roadmap;
- identify stale project-authority files that could send a future developer backward;
- make GitHub itself sufficient to orient the next developer even if prior ChatGPT/Work history is unavailable;
- deepen the next post-v1 milestone to concrete source ownership, data boundaries, failure cases and candidate gates;
- keep the current r5 visual acceptance distinction intact.

## 2. Starting state

Main documentation head at start:

`bac390abb9c41f6e24df68bf9cafc43e79021830`

That commit followed the technically complete r5 player-photography merge and added the post-merge handoff only.

Current runtime implementation merge:

`8f4f9d2c94e1e1f03f50fb439df34f423cc06d1e`

Application version:

`v1.0.1`

Runtime revision:

`1.0.1-r5`

r5 technical status:

`COMPLETE, MERGED, DEPLOYED, POST-MERGE GREEN`

Owner r5 visual status:

`PENDING REAL-DEVICE REVIEW`

No source/runtime feature work was authorized in this roadmap pass.

## 3. Source and roadmap material studied

Repository files studied:

- `ROADMAP_AMENDMENTS.md`
- `PROJECT_STATE.md`
- `NEXT_TASK.md`
- `STABILITY_PLAN_V1.0.X.md`
- `README.md`
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION.md`
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION_POST_MERGE.md`
- `js/storage.js`
- `js/showdown.js`
- `js/settings.js`
- `js/legacy.js`
- `tests/contracts/stability-contracts.cjs`
- current `main` tree and permanent workflow set

External project-history source recovered from the owner file library and fully read:

`CAREER_MODE_SHOWDOWN_POST_V1_ROADMAP_2026-08-09.md`

This was important because the repository's `ROADMAP_AMENDMENTS.md` is mainly a record of completed v0.95/v1 requirements and only briefly states the post-v1 direction. The August 9 roadmap contains the full dependency-ordered future program through the conditional v3 decision gate.

## 4. Critical continuity defect found

`NEXT_TASK.md` was stale.

Before this pass it still opened with the August 10 r3 visual rejection and instructed the next developer to reproduce/replace the r3 football-image presentation.

That was historically accurate when written, but it was no longer the current implementation state because:

- r4 recovery had subsequently merged;
- the owner then requested another James/Rashford/Martial rebuild;
- r5 had been implemented and merged through PR #11;
- r5 had deployed successfully;
- all post-merge technical visual/stability gates had passed.

Why this mattered:

A new developer following the official read order could have started by redoing already completed image architecture or reverting to an obsolete visual baseline.

Decision:

Do not change current r5 source to satisfy stale task text. Update the task authority.

## 5. Post-v1 roadmap recovered and preserved

Approved dependency order:

`v1.0.x Stability Lane`
→ `v1.1.0 Data Safety and Recovery`
→ `v1.2.0 Installable Offline App`
→ `v1.3.0 Local Profiles and Save Library`
→ `v1.4.0 Legacy 2.0 and Achievements`
→ `v1.5.0 Analytics 2.0`
→ `v1.6.0 Optional Content Packs`
→ `v1.7.0 Challenge Studio`
→ `v1.8.0 Cloud Readiness`
→ `v1.9.0 Opt-In Cloud Backup Beta`
→ `v2.0.0 Private QR Paired Two-Device Alpha`
→ `v2.1.0 Connected Rivalry`
→ `v2.2.0 Private Sharing and Groups`
→ conditional `v3.0` Community/Rankings decision gate

Central dependency rule:

Do not introduce cloud/two-device state on the present singleton local-storage model. Export/import, migrations, stable identities, a save registry and then a cloud-ready repository boundary must exist first.

## 6. Current source-grounded persistence model

### Storage authority

`js/storage.js` remains the sole public persistence authority.

Current localStorage keys:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Application preference schema version:

`2`

Important caches/state inside the authority:

- scheduled active-save timer;
- active-save presence cache;
- Legacy cache plus Legacy revision counter;
- application-preferences cache;
- motion preference lifecycle state.

### Current failure philosophy

Storage wrappers already catch read/write/remove failures.

Malformed current bytes are not silently erased:

- malformed active JSON fails closed and remains in localStorage;
- malformed Legacy JSON produces an empty derived view but preserves raw bytes;
- malformed preferences fall back to safe in-memory defaults without silently deleting raw storage.

Stability contracts protect these behaviors.

Roadmap implication:

v1.1 backup/export cannot simply call the existing forgiving UI readers and pretend damaged records are absent. The backup/recovery design must explicitly preserve/report recoverable malformed raw bytes while keeping the canonical parsed payload honest.

## 7. Current Showdown identity/schema reality

`js/showdown.js` currently defines:

`CURRENT_SHOWDOWN_SCHEMA_VERSION = 2`

New Showdown identity is currently:

`id: Date.now()`

The ID persists inside active and Legacy snapshots.

Current revision clues include:

- `updatedAt`
- `completedAt`
- `archivedAt`

Legacy archive logic compares IDs using string conversion and checks `updatedAt` plus `completedAt` to identify an already-current archived revision.

Roadmap decision:

v1.1 must preserve existing Showdown IDs exactly. It should not introduce the later opaque manager/Showdown/Season identity model merely because stable IDs are useful for future cloud work.

The identity redesign belongs to v1.3 together with the multi-save registry, recurring manager profiles and historical-name mapping.

This prevents v1.1 from becoming an accidental partial v1.3 migration.

## 8. Existing Data Management architecture

`js/settings.js` already provides a Local Storage / Data Management panel.

Its action opens the lazy Legacy module rather than creating another Settings-owned persistence screen.

`js/legacy.js` already owns:

- individual archived Showdown deletion;
- delete-all Legacy history;
- Reset All Showdown Data;
- destructive confirmation wording;
- transactional rollback when active-completed/Legacy deletion must stay coherent.

Roadmap decision:

The preferred first v1.1 UI surface is the existing lazy Legacy Data Management area. Add Export/Import there and keep Settings linking to it.

Do not add a new top-level route just because backup is a new feature unless browser/usability evidence shows the existing surface is insufficient.

This preserves `js/screens.js` route authority and avoids unnecessary route growth.

## 9. v1.1 refined candidate boundaries

### Candidate A — Backup Envelope and Non-Mutating Export

Only Candidate A should enter the first v1.1 implementation branch after the current visual gate exits.

Required outcomes:

- versioned backup envelope;
- active Showdown + Legacy + preferences;
- app/export metadata and counts;
- deterministic corruption-detection checksum;
- human-inspectable JSON download;
- explicit unreadable-data warnings/recovery representation;
- Export Backup UI in existing Data Management;
- large-history behavior test;
- deterministic/browser/accessibility tests;
- zero localStorage writes/removals.

Explicitly excluded:

- import commit;
- merge/restore;
- profiles/save slots;
- service worker/PWA;
- cloud/background backup.

### Candidate B — Import Analysis and Migration Preview

Reads a backup in isolation.

Required outcomes:

- input size limit;
- format/checksum/schema validation;
- future-format rejection;
- ordered migrations;
- active/Legacy/preferences preview;
- duplicate/conflict classification;
- dry-run warnings/errors;
- zero localStorage writes/removals.

### Candidate C — Atomic Restore and Recovery UX

Only this candidate commits restored data.

Required transaction:

1. flush current pending application writes;
2. revalidate analyzed input;
3. snapshot exact affected raw keys;
4. compute explicit user-selected result in memory;
5. write through `js/storage.js` only;
6. roll back every affected raw key on any failure;
7. verify rollback;
8. invalidate caches/refresh UI only after successful transaction;
9. prove re-import idempotence.

## 10. v1.1 backup-format design issues surfaced

Future Candidate A/B developers must explicitly decide/test:

- backup `formatId` and independent `formatVersion`;
- exact canonical serialization used for checksum;
- whether Web Crypto SHA-256 satisfies target browser support;
- checksum field exclusion from its own digest;
- exact representation for malformed current raw data;
- supported historical Showdown/preference schema corpus;
- maximum import size;
- duplicate vs conflicting revision classification;
- completed active save also appearing in Legacy;
- cache invalidation after Candidate C commit/rollback;
- canonical post-restore route/UI state.

The runtime revision is diagnostic metadata only. It must not become the backup migration authority.

Checksum wording must be honest: accidental-corruption detection, not encryption/authentication/signing.

## 11. v1.1 fixture corpus identified

At minimum:

- empty storage;
- active only;
- Legacy only;
- preferences only;
- all three records;
- completed active also in Legacy;
- historical Showdown schema 1;
- current Showdown schema 2;
- preference schema 1;
- preference schema 2;
- malformed active JSON;
- malformed Legacy JSON;
- invalid Legacy shape;
- malformed preferences;
- duplicate Legacy IDs;
- same ID/different revision/content;
- future backup format;
- future Showdown schema;
- oversized file;
- checksum mismatch;
- quota failure during restore;
- partial failure at each affected key;
- rollback failure;
- repeated import/idempotence.

## 12. Roadmap boundaries clarified for later milestones

### v1.2 PWA/offline

Blocked until local recovery works. Must prove service-worker revision update/rollback and must not cache external media blindly.

### v1.3 local profiles/save library

Owns opaque stable identities and the versioned multi-save registry. Must solve ambiguous historical manager names with explicit mapping, not name equality.

### v1.4 Legacy 2.0/achievements

Depends on stable identities. Achievements remain derived recognition and cannot change max-11 scoring.

### v1.5 Analytics 2.0

Depends on identity/history model. `js/analytics.js` remains authority; charts require accessible table alternatives.

### v1.6 content packs

Default five-league mode remains canonical; extras are opt-in validated packs.

### v1.7 challenge studio

Optional objectives remain separate from canonical Season scoring.

### v1.8 cloud readiness

No cloud UI. Introduces async repository interface behind storage authority, revisions/tombstones/merge rules, threat/privacy model and local sync simulator.

### v1.9 cloud backup beta

Only after provider/privacy/budget decision. First remote value is opt-in backup/restore, not realtime gameplay.

### v2.0 paired two-device alpha

Requires reliable remote state/security. Existing separated Transfer phases become role-private. Host remains canonical for irreversible first-alpha progression.

### v2.1 connected rivalry

Adds full shared state/reconnect/two-party confirmation/deterministic conflict handling.

### v2.2 private sharing/groups

Revocable completed-Showdown read-only sharing first; default private; no public feed/comments.

### v3 decision gate

Not approved implementation. Public rankings require real demand, verification distinction, privacy/moderation and owner-approved budget.

## 13. Files created/changed in this pass so far

Branch created from `bac390abb9c41f6e24df68bf9cafc43e79021830`:

`agent/roadmap-handoff-deepening-r1`

### Commit `b4d0aa398875b3544b4993d0424d1179803c722c`

Added:

`00_DEVELOPER_START_HERE.md`

Purpose:

one obvious operational entry point for future ChatGPT/Work/developer sessions.

### Commit `736ea520e8f4817db3102f7f565a4cb46b756a88`

Added:

`POST_V1_ROADMAP_EXECUTION.md`

Purpose:

bring the approved future roadmap into GitHub and deepen it against live source/ownership boundaries.

### Commit `2509ab6912e86d630016ba732cc7ef993067f6c2`

Replaced stale:

`NEXT_TASK.md`

New behavior:

- r5 is recognized as technically complete;
- owner visual acceptance remains open;
- new r5 rejection evidence stays in finite visual lane;
- owner acceptance/deferral unlocks v1.1;
- Candidate A is explicitly the first feature branch;
- Candidate B/C remain blocked;
- exact current storage/schema/UI ownership and zero-write requirements are documented.

### This handoff commit

Adds this detailed roadmap-deepening chronology so future sessions can understand not only the resulting roadmap but why the source-grounded refinements were chosen.

## 14. Current developer entry architecture after this pass

A future developer should no longer begin by reading a long historical audit.

Fast operational path:

`00_DEVELOPER_START_HERE.md`
→ `NEXT_TASK.md`
→ current section of `POST_V1_ROADMAP_EXECUTION.md`
→ named live source files

Historical/deep path only when necessary:

`PROJECT_STATE.md`
→ `ROADMAP_AMENDMENTS.md`
→ `STABILITY_PLAN_V1.0.X.md`
→ r5 main handoff
→ r5 post-merge addendum
→ this roadmap-deepening continuation
→ older Project Bible/historical exports.

## 15. Current acceptance/next-action rule

Do not begin v1.1 merely because documentation now describes it in detail.

The current decision gate is still:

- if owner reports an r5 visual defect, reproduce/fix it from current r5;
- if owner accepts r5 or explicitly defers visual review, begin v1.1 Candidate A.

This preserves the finite stability-lane exit rule while making the next feature implementation immediately actionable.

## 16. Continuous handoff instruction for future developers

For every meaningful development session, update continuity as work occurs, not at the end from memory.

Record:

- exact owner scope change/correction;
- branch/PR;
- source authority chosen when docs conflict;
- root cause of failures;
- implementation/data-model decisions;
- tests/gates added or changed;
- exact candidate/merge SHAs;
- CI status and failure classification;
- Pages deployment identity/result;
- owner acceptance status;
- immediate next task.

If official exports of the older max-length chats become available, reconcile historical chronology without reverting newer current-source authority.

## 17. Immediate next action for this documentation pass

1. compare this branch against `main` and confirm it contains documentation/authority changes only;
2. confirm current stability contracts still accept the new `NEXT_TASK.md` version/revision strings;
3. open a focused PR;
4. require applicable repository workflows to pass on one exact head;
5. merge with expected-head protection;
6. verify post-merge checks and that no runtime byte changed;
7. record final merge state for the next developer.