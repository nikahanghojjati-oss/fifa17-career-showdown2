# Career Mode Showdown — Developer Start Here

Last updated: 2026-08-11
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Purpose: canonical session bootstrap for a new ChatGPT, Work, or developer session.

## 0. Why this file exists

The project has accumulated a large amount of correct historical documentation, but some older authority files describe intermediate visual states that have already been superseded by newer source and owner-directed work.

A future developer should not have to reconstruct the project by reading every old conversation before knowing what to do.

Use this file as the first orientation document. It does not replace current source. It points to the current implementation, the current gate, the post-v1 dependency roadmap, the protected systems, the exact next decision, and the detailed historical handoff when deeper archaeology is required.

## 1. Authority order

When sources disagree, use this order:

1. Current source on `main`.
2. Later explicit owner instruction or rejection/acceptance evidence.
3. `00_DEVELOPER_START_HERE.md` for the current session bootstrap.
4. `PROJECT_STATE.md` for established system contracts and accepted historical baselines.
5. `NEXT_TASK.md` for the immediate implementation gate.
6. `POST_V1_ROADMAP_EXECUTION.md` for dependency order and future milestone execution detail.
7. `ROADMAP_AMENDMENTS.md` for owner-approved pre-v1 amendments and completed workstreams.
8. `STABILITY_PLAN_V1.0.X.md` for the finite stability-lane philosophy and the original v1.1 A/B/C split.
9. `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION.md` and `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION_POST_MERGE.md` for detailed r5 chronology and chat/action history.
10. Older Project Bible and historical chats where later source/decisions have not superseded them.

Never satisfy stale documentation by reverting newer verified source. Update the stale document instead.

## 2. Current production snapshot

Application version: `v1.0.1`

Runtime asset revision: `1.0.1-r5`

Hosting: GitHub Pages

Product architecture: static SPA using HTML, CSS, vanilla JavaScript and browser localStorage.

Product mode: exactly two managers, one device/browser, one active Showdown.

Current runtime implementation merge:

`8f4f9d2c94e1e1f03f50fb439df34f423cc06d1e`

That merge contains the r5 smart-crop rebuild for James Rodríguez, Marcus Rashford and Anthony Martial.

Documentation-only post-merge handoff commit on `main`:

`bac390abb9c41f6e24df68bf9cafc43e79021830`

The documentation commit did not change runtime files.

## 3. Current release state

Technical r5 state:

`COMPLETE, MERGED, DEPLOYED, POST-MERGE GREEN`

Owner visual acceptance state:

`PENDING REAL-DEVICE REVIEW`

Do not call r5 visually accepted until the owner explicitly accepts it or explicitly defers the visual gate.

Do not rebuild the same three images merely because older `NEXT_TASK.md` text or older handoffs mention the rejected r3/r4 state. The current r5 implementation is the baseline.

Real-device screens that still matter for owner art-direction acceptance:

- Create Showdown — James Rodríguez.
- Transfer Challenge — Marcus Rashford.
- Transfer Challenge — Anthony Martial.
- Home/loading — Marco Reus regression check.

If the owner supplies new rejection screenshots, use those screenshots as evidence and make the smallest targeted correction from current r5. Do not return automatically to rejected r3/r4 photographs or the rejected intermediate 2016 r5 Rashford candidate.

## 4. r5 visual authority

James Rodríguez:

- asset: `assets/football/james-rodriguez-real-madrid-2019-smart-r5.webp`
- authored source crop: `[20, 0, 540, 705]`
- output: `520 × 705`
- runtime: full authored derivative under `object-fit: contain`

Marcus Rashford:

- asset: `assets/football/marcus-rashford-man-utd-2017-smart-r5.webp`
- final source: Manchester United v RSC Anderlecht, 20 April 2017
- authored source crop: `[1050, 300, 2350, 2200]`
- output: `753 × 1100`
- final desktop Transfer media stage: `43%`
- final mobile/small-phone stage: `52%`
- runtime: full authored derivative under `object-fit: contain`

Anthony Martial:

- asset: `assets/football/anthony-martial-man-utd-2016-smart-r5.webp`
- source: Manchester United v Zorya Luhansk, September 2016
- authored source crop: `[0, 0, 1800, 2400]`
- output: `825 × 1100`
- final desktop Transfer media stage: `48%`
- final mobile/small-phone stage: `56%`
- runtime: full authored derivative under `object-fit: contain`

Marco Reus remains the Home/loading identity. Messi and Lahm remain their accepted r4 crop-safe assets.

## 5. Post-merge proof already completed

PR #11 final pre-merge head:

`1f5977e8d175c2baa2ae9f657fc5ff47b2f2ffa6`

All eleven permanent workflows passed on that exact SHA before merge.

PR #11 was merged with expected-head protection.

Pages deployment ID for the r5 merge:

`5850071239`

Pages deployment: success.

Post-merge Licensed Football Visuals: success.

Post-merge Stability Lane: success.

The deployed-site smoke passed:

- exact deployed runtime-byte verification;
- runtime error provenance;
- Home / Marco Reus audit;
- crop-safe football-photo audit;
- complete deployed gameplay/navigation journey.

Do not spend a new session repeating this evidence unless source has changed or a new failure is reported.

## 6. Locked gameplay rules

These are not roadmap suggestions. They are product invariants.

Per manager per Season:

- Champions League: `+5`.
- Domestic League: `+3`.
- Main domestic Cup: `+1`.
- 100 league points and/or 100 league goals: shared maximum `+1`.
- Top Scorer and/or Top Assist: shared maximum `+1`.
- Maximum Season score: `11`.

Winner logic:

1. higher Season score wins;
2. equal non-zero scores remain a Draw;
3. only `0–0` uses better league position, then more league points;
4. if still tied, Draw.

Other competition locks:

- exactly two managers;
- same selected league;
- two different permanent clubs assigned once;
- no club reroll after assignment transaction;
- club reuse across separate Showdowns allowed;
- 1 / 3 / 5 / 10 Seasons;
- default Showdown Wheel remains Premier League, LaLiga, Bundesliga, Serie A and Ligue 1;
- Transfer Challenge remains maximum three signings each and three opponent guesses;
- correctly guessed signing is released;
- manual FIFA 17 result entry remains authoritative.

## 7. Architecture locks

Navigation:

- `js/screens.js` is the sole route/history authority.
- Smart Back remains centralized.
- Settings and Season Review are not independent routes.
- critical writes flush before legal route departure.

Persistence:

- `js/storage.js` is the sole public persistence authority.
- no feature module may begin direct localStorage ownership.
- critical writes save first and rollback/block on failure.
- drafts remain debounced/deduplicated.

Analytics:

- `js/analytics.js` is the sole calculation authority.
- statistics stay derived unless profiling proves a cache is required.
- do not create a parallel statistics database.

Architecture style:

- no framework rewrite merely for modernization;
- lazy gameplay/optional modules remain lazy unless measurement proves otherwise;
- every changed runtime byte gets a new cache identity;
- Chromebook and mobile remain first-class targets;
- reduced motion remains a binding accessibility path.

## 8. Current storage reality before v1.1

There are exactly three persistent localStorage keys owned by `js/storage.js`:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Current application preference schema version: `2`.

Current Showdown schema version: `2`.

Current Showdown identity is the persisted `id` created at Showdown creation. Existing saves use a numeric `Date.now()` value. Do not silently replace those IDs inside v1.1 just to anticipate v1.3.

Legacy currently deduplicates by stringified Showdown ID and compares `updatedAt` plus `completedAt` to determine whether the archived revision is already current.

Corrupt active, Legacy and preference bytes are intentionally not silently erased. Current stability tests protect that behavior.

This matters for Data Safety: backup/export must not destroy or overwrite current local data merely because parsing or validation fails.

## 9. Current roadmap dependency chain

The current approved dependency order is:

`v1.0.x Stability Lane`
→ `v1.1.0 Data Safety and Recovery`
→ `v1.2.0 Installable Offline App`
→ `v1.3.0 Local Manager Profiles and Save Library`
→ `v1.4.0 Legacy 2.0 and Achievements`
→ `v1.5.0 Analytics 2.0`
→ `v1.6.0 Optional Content Packs`
→ `v1.7.0 Challenge Studio`
→ `v1.8.0 Cloud Readiness`
→ `v1.9.0 Opt-In Cloud Backup Beta`
→ `v2.0.0 Private QR Paired Two-Device Alpha`
→ `v2.1.0 Connected Rivalry`
→ `v2.2.0 Private Sharing and Groups`
→ `v3.0 Community/Rankings decision gate only if justified`

The central rule is dependency integrity:

Cloud and two-device work cannot begin on the current singleton storage model. Export/import, migrations, stable identities and a local save registry must exist first.

Read `POST_V1_ROADMAP_EXECUTION.md` for the detailed execution map.

## 10. Exact next-decision tree

A new developer should not guess the next task.

### Path A — owner supplies r5 rejection evidence

Stay inside the finite v1.0.x visual lane.

1. reproduce the exact real-device composition;
2. identify whether the defect is source crop, media-stage geometry, rendering density, overlay/compositing, or responsive layout;
3. preserve accepted screens and all gameplay/storage/routing behavior;
4. add or strengthen a permanent visual gate for the reproduced failure class;
5. validate desktop, near-breakpoint and mobile;
6. merge only after exact-SHA checks and deployed verification;
7. keep owner acceptance open until the corrected public build is inspected.

Do not reopen unrelated visual redesign.

### Path B — owner accepts r5 or explicitly defers visual review

The Stability Lane exits and v1.1.0 becomes Current.

Start only Candidate A: backup envelope and non-mutating export.

Do not begin Candidate B import writes or Candidate C restore in the same first implementation branch unless Candidate A is fully validated and the owner explicitly requests combining them.

## 11. v1.1.0 Data Safety — bounded execution order

Candidate A — Backup Envelope and Export

Goal: create a complete, human-inspectable, versioned backup without mutating storage.

Required work:

- freeze the supported storage/schema fixture corpus;
- capture active Showdown, Legacy and preferences through the storage authority;
- include backup format ID/version, application version, export time, record counts and checksum metadata;
- explicitly surface parse/validation warnings without deleting source bytes;
- create a deterministic downloadable JSON file;
- add Export Backup to the existing Data Management surface;
- prove export causes zero localStorage writes;
- measure large-history export behavior;
- add deterministic and real-browser tests.

Candidate B — Import Analysis and Migration Preview

Goal: parse and migrate in isolation before anything writes.

Required work:

- input-size ceiling;
- JSON/format/checksum/schema validation;
- future-version rejection;
- ordered non-mutating migrations;
- active save / Legacy / preference preview;
- duplicate and conflict analysis;
- clear warnings and dry-run outcome;
- no localStorage mutation.

Candidate C — Atomic Restore and Recovery UX

Goal: commit explicit restore choices safely.

Required work:

- complete pre-import raw snapshot;
- explicit active-save replacement choice;
- explicit Legacy merge choice;
- explicit preference restoration choice;
- deduplication/conflict policy;
- all writes through `js/storage.js`;
- rollback every affected key if any write fails;
- cache invalidation and UI refresh only after successful commit;
- idempotent re-import testing;
- corrupt/quota/partial-write/browser/deployed tests.

## 12. v1.1 identity boundary

Do not confuse v1.1 backup identity with the v1.3 profile/save-registry redesign.

For v1.1:

- preserve existing Showdown IDs exactly;
- compare existing IDs as strings for compatibility;
- use current timestamps/fingerprints/checksum information for conflict preview;
- do not create manager account/profile identities;
- do not replace the singleton active-save model;
- do not create cloud revisions or writer IDs.

v1.3 is the milestone that introduces stable opaque manager, Showdown, Season and content-pack identities together with the multi-save registry and historical manager mapping UI.

## 13. Natural v1.1 UI entry point

Settings currently labels the current storage model and routes Data Management to the existing Legacy module.

Legacy already owns:

- individual Legacy deletion;
- delete-all Legacy history;
- Reset All Showdown Data;
- destructive confirmations and rollback behavior.

Therefore the lowest-risk v1.1 UI direction is to add backup/import Data Management controls in that existing lazy surface, with Settings continuing to link to it.

Do not create a new top-level navigation route merely to host backup controls unless evidence proves the existing surface cannot support the workflow cleanly.

## 14. v1.1 safety design questions already identified

These are the questions a Candidate A/B implementation must answer explicitly rather than hide in code:

1. What exact backup format identifier and version are used?
2. What bytes/structure are included in the checksum, and how is canonical serialization defined?
3. If one current storage record is malformed, does Export include a warning plus a recoverable raw representation rather than pretending the record does not exist?
4. What maximum import file size is accepted before parsing?
5. Which old Showdown/preference schemas are officially supported?
6. How are duplicate Legacy records distinguished from conflicting revisions?
7. When active and Legacy contain the same completed Showdown, how is that relationship presented rather than duplicated blindly?
8. What exact raw snapshots are captured before Candidate C writes?
9. How are caches (`legacyCache`, active presence cache, preferences cache) invalidated after successful or rolled-back import?
10. Which UI state is refreshed after restore and which route becomes canonical?

Do not answer these by adding a second persistence authority.

## 15. Later milestone boundaries

### v1.2.0 — Installable Offline App

May begin only after v1.1 recovery is reliable.

Adds manifest/service worker/update/offline shell.

Must not cache third-party media blindly, must not reload through unsaved forms, and must prove two consecutive cache-revision update/rollback paths.

### v1.3.0 — Local Profiles and Save Library

May begin only after export/import/migrations exist.

Introduces stable opaque identities and replaces the singleton active key internally with a versioned local registry while preserving `js/storage.js` as public persistence authority.

This milestone must solve historical manager-name ambiguity explicitly; name equality alone cannot merge identities.

### v1.4.0 — Legacy 2.0 and Achievements

Depends on stable identities.

Achievements remain derived recognition and never change canonical Season score.

### v1.5.0 — Analytics 2.0

Depends on identity/history model.

Charts must have accessible table alternatives and analytics remain derived.

### v1.6.0 — Optional Content Packs

Default five-league Showdown remains unchanged.

Extra leagues/custom pools are opt-in validated packs, not silent expansion of canonical mode.

### v1.7.0 — Challenge Studio

Optional challenge objectives stay separate from max-11 scoring.

### v1.8.0 — Cloud Readiness

No cloud UI.

Adds async repository boundary behind `storage.js`, migrations, revisions/tombstones, merge rules, threat/privacy model and local two-device sync simulator.

### v1.9.0 — Cloud Backup Beta

Only after provider/privacy/budget decision.

Opt-in backup/restore is the first remote value. No realtime gameplay yet.

### v2.0.0 — Private QR Paired Two-Device Alpha

Depends on reliable remote backup/state/security.

Host remains canonical for irreversible progression in first alpha; separated Transfer phases become role-private screens.

### v2.1.0 — Connected Rivalry

Adds reliable shared canonical state, reconnect, two-party confirmations and deterministic conflicts.

### v2.2.0 — Private Sharing and Groups

Read-only revocable completed-Showdown links first, then invited groups. Default remains private.

### v3.0 — Conditional Community Gate

Not an approved implementation milestone.

Do not build public rankings merely from self-entered results without a verification model, privacy/moderation plan and owner-approved operating budget.

## 16. Maintenance requirements for every future milestone

Every feature release must also:

- reproduce owner-reported defects before changing behavior;
- preserve one router and one persistence authority;
- test failed writes, quota, corrupt records, reload, rapid navigation, browser Back/Forward and double-submit behavior;
- test normal and reduced motion;
- test 1366 × 768 Chromebook and 390 × 844 mobile touch paths;
- scan changed screens for duplicate IDs, focus, names, contrast and visible overflow;
- measure initial/raw/gzip/runtime asset budgets;
- keep optional media lazy;
- verify changed public assets after Pages deploy;
- update state, next-task, changelog, runtime revision and release status coherently when runtime bytes change.

## 17. Definition of done

A milestone is not complete because code exists.

Before declaring completion:

1. scope and exclusions are explicit;
2. storage/schema changes have migrations;
3. critical/destructive writes have rollback tests;
4. deterministic contracts pass;
5. complete real-browser journeys pass;
6. normal/reduced motion pass;
7. keyboard/mouse/touch critical actions pass;
8. accessibility scans have no serious/critical changed-screen violation;
9. no severe console error, unhandled rejection, duplicate ID, visible overflow or failed local asset remains;
10. performance/cache identity stays coherent;
11. candidate SHA is frozen;
12. PR checks pass;
13. post-merge checks pass on main;
14. Pages deploys the exact merge;
15. deployed runtime matches committed source;
16. rollback target is known;
17. project documents state implemented/pending/accepted/next accurately;
18. material visual/interaction changes receive owner browser acceptance in addition to automated evidence.

## 18. Session bootstrap checklist

At the beginning of a new developer session:

1. fetch current `main` and record its SHA;
2. read this file completely;
3. read `NEXT_TASK.md` completely;
4. read the Current milestone section of `POST_V1_ROADMAP_EXECUTION.md`;
5. inspect actual source files named by the next task before coding;
6. inspect recent PR/merge history if the next task references a prior correction;
7. do not ask the owner to repeat facts already documented here unless new evidence is genuinely required;
8. create a focused branch from current main for runtime work;
9. keep the owner informed during long work;
10. update the rolling handoff when a meaningful decision, failure, correction, merge or deployment happens.

## 19. Handoff maintenance protocol

The owner explicitly requires development actions and substantive chat decisions to be recorded continuously for future sessions.

During future work, record at minimum:

- exact owner instruction/correction that changes scope;
- branch and PR;
- source authority chosen when documents conflict;
- root cause of every meaningful failure;
- implementation decisions that future developers could otherwise misread;
- final selected assets/data contracts;
- exact candidate/merge SHAs;
- CI failures and whether they were app/test/infrastructure/visual-acceptance failures;
- deployment ID/status;
- owner acceptance still open vs accepted;
- exact next action.

Do not wait until a conversation limit warning to reconstruct the handoff from memory.

## 20. Historical chat/export status

Two especially important older chats previously reached maximum length:

- `Website Creation and Guide`
- `Career Mode Showdown Dev`

Existing handoffs recover their important project decisions but are not claimed to be byte-for-byte platform exports.

If the owner later supplies the official ChatGPT export, ingest and reconcile it for historical precision. Do not let older historical wording revert newer source authority.

## 21. Latest owner request recorded

Owner request, 2026-08-11:

> Do a development on current roadmap to understand it more deeply and then make the room much more detailed and accessible to follow for next chat or work developer sessions

Interpretation used for this documentation work:

- deepen the approved current roadmap against live source rather than invent a new product direction;
- move the important post-v1 roadmap into the repository so a GitHub-only future developer can access it;
- correct stale immediate-task guidance left from the r3 image incident;
- create one obvious session-bootstrap document;
- explain v1.1 at concrete source/data-authority level;
- make future chat/Work continuation materially easier without restarting planning.

## 22. Current action log for roadmap-deepening pass

1. Read current `main` after r5 merge and post-merge handoff.
2. Re-read `ROADMAP_AMENDMENTS.md` and separated completed v0.95/v1 history from future roadmap.
3. Recovered and fully read the owner-approved August 9 post-v1 roadmap from the project file library.
4. Re-read `PROJECT_STATE.md`, `NEXT_TASK.md` and `STABILITY_PLAN_V1.0.X.md`.
5. Identified `NEXT_TASK.md` authority drift: it still described the rejected r3 presentation as the live implementation blocker even though r5 is merged/deployed/green.
6. Inspected `js/storage.js` and confirmed exactly three persistence keys, current caches, rollback helpers, corrupt-byte fail-closed behavior and preference schema 2.
7. Inspected `js/showdown.js` and confirmed Showdown schema 2, persisted numeric current IDs, normalization behavior and timestamp-based revision clues.
8. Inspected `js/settings.js` and confirmed Settings deliberately routes Data Management into the Legacy optional module.
9. Inspected `js/legacy.js` and confirmed the existing Data Management surface already owns deletion/reset confirmations and rollback transactions.
10. Created branch `agent/roadmap-handoff-deepening-r1` from documentation head `bac390abb9c41f6e24df68bf9cafc43e79021830`.
11. Added this canonical developer-session bootstrap.
12. Next in this pass: add the repository-native post-v1 execution roadmap, replace stale `NEXT_TASK.md`, validate the documentation diff, open a focused PR and merge only after repository checks are clean.