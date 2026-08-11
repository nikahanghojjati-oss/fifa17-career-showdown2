# Career Mode Showdown — Developer Start Here

Last updated: 2026-08-11
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Purpose: canonical first-read operating guide for a new ChatGPT, Work, or developer session.

## 0. Sixty-second project state

Application: `v1.1.2`

Runtime asset revision: `1.1.2-r1`.

Candidate A backup/export is complete, deployed and protected. Candidate B — Import Analysis + Migration Preview — is the current substantive Data Safety and Recovery build. Candidate C restore remains blocked.

Candidate B is preview-only: local backup file size, JSON, format, checksum, schemas, historical migrations and ID conflicts are analyzed in memory with zero canonical localStorage writes/removals. The existing Legacy/Data Management surface remains the UI owner and the feature stays lazy so startup budgets remain protected.

The owner-mandated `00_HANDOFF_GOLDEN_RULE.md` is permanent operating policy: every meaningful action/failure/decision/gate/merge/deployment state must be recorded continuously in the active public handoff.

After Candidate B is merged/deployed/proven, Candidate C — Atomic Restore + Recovery UX — becomes the next legal v1.1.x step. v1.2.0 remains reserved for Installable Offline App.

## 1. Start every new session in this order

1. Read `00_HANDOFF_GOLDEN_RULE.md` and identify/create the active public handoff.
2. Fetch current `main` and record its SHA.
2. Read this file completely.
3. Read `NEXT_TASK.md` completely.
4. Read the Current milestone and dependency sections of `POST_V1_ROADMAP_EXECUTION.md`.
5. Inspect the live source files named by the active task before changing anything.
6. Use deeper handoff/chronology files only when history or source authority is ambiguous.
7. Do not ask the owner to repeat decisions already recorded here unless new evidence is genuinely required.
8. For runtime work, create a focused branch from current `main`.
9. Keep the owner informed during long development work.
10. Record every meaningful decision, failure, correction, merge, deployment, and owner-acceptance state in the current handoff.

Do not begin by reading every old chat. The repository has already been reorganized so a fresh session can become operational from GitHub alone.

## 2. Authority order

When sources disagree, use this order:

1. Current source on `main`.
2. Later explicit owner instruction or owner acceptance/rejection evidence.
3. `00_DEVELOPER_START_HERE.md` for current session bootstrap.
4. `NEXT_TASK.md` for the immediate legal implementation path.
5. `POST_V1_ROADMAP_EXECUTION.md` for dependency order and future milestone execution.
6. `PROJECT_STATE.md` for established system contracts and accepted historical baselines.
7. `ROADMAP_AMENDMENTS.md` for owner-approved pre-v1 amendments and completed workstreams.
8. `STABILITY_PLAN_V1.0.X.md` for the finite stability philosophy and original v1.1 candidate split.
9. Release records, changelog, and current handoff files.
10. Older Project Bible and historical chats where later source/owner decisions have not superseded them.

Never satisfy stale documentation by reverting newer verified source. Update the stale document instead.

## 3. Product model that is currently locked

The current product is a FIFA 17 Career Mode rivalry companion, not a football simulation engine.

Current mode:

- exactly two managers;
- one browser/device;
- one active local Showdown;
- manual FIFA 17 result entry;
- localStorage persistence;
- GitHub Pages deployment;
- static SPA using HTML, CSS, and vanilla JavaScript.

The accepted experience includes:

- Home / Continue Career;
- Create Showdown;
- League Wheel and explicit League confirmation;
- Club Assignment and sealed two-pack reveal;
- permanent same-league/different-club rivalry;
- Showdown Home;
- Transfer Challenge;
- Season Results;
- Season Review / Edit / Confirm;
- Season Summary;
- current Rivalry Statistics;
- all-time Career Statistics;
- Legacy;
- Trophy Room;
- Rule Book;
- Settings;
- Smart Back;
- diagnostics/stability behavior;
- lazy optional modules;
- user-initiated Home media.

## 4. Locked gameplay rules

Per manager per Season:

- Champions League winner: `+5`;
- Domestic League winner: `+3`;
- Main domestic Cup winner: `+1`;
- 100 league points and/or 100 league goals: shared maximum `+1`;
- Top Scorer and/or Top Assist: shared maximum `+1`;
- maximum Season score: `11`.

Winner logic:

1. higher Season score wins;
2. equal non-zero scores remain a Draw;
3. only `0–0` uses league position;
4. if league position is equal at `0–0`, league points are used;
5. if still tied, Draw.

Other locks:

- both managers use the same selected league;
- clubs must be different;
- clubs are assigned once and remain permanent for the entire Showdown;
- no club reroll after the assignment transaction;
- club reuse across separate Showdowns is allowed;
- Showdown length remains 1 / 3 / 5 / 10 Seasons;
- default Wheel remains Premier League, LaLiga, Bundesliga, Serie A, and Ligue 1;
- Transfer Challenge remains maximum three signings each and three opponent guesses;
- guess type remains League or Nationality;
- a correctly guessed signing is released;
- manual FIFA 17 results remain authoritative.

Do not let achievements, Challenge Studio, analytics, content packs, cloud features, or future online play change the canonical max-11 Season score.

## 5. Architecture ownership map

### Navigation and route history

Authority: `js/screens.js`

Rules:

- it is the sole route/history authority;
- Smart Back stays centralized;
- feature modules do not create their own route history;
- Settings remains modal/lazy rather than a parallel router;
- Season Review remains ephemeral rather than a persisted route;
- critical writes must complete or roll back before legal route departure.

### Persistence

Authority: `js/storage.js`

Rules:

- it is the sole public persistence authority;
- no feature module may begin direct localStorage ownership;
- critical writes save first and rollback/block on failure;
- drafts remain debounced/deduplicated;
- malformed storage bytes are preserved rather than silently erased;
- future backup/import must extend this authority, not create a second persistence system.

### Canonical Showdown model

Authority: `js/showdown.js`

Current Showdown schema version: `2`.

Existing Showdown IDs are persisted values created with `Date.now()` for new Showdowns.

Do not replace those IDs inside v1.1 merely to anticipate future profile/save-registry work.

### Scoring

Authority: `js/scoring.js`

The max-11 scoring/tiebreak rules above are immutable unless the owner explicitly changes the competition design.

### Analytics

Authority: `js/analytics.js`

Rules:

- statistics remain derived;
- do not create a parallel analytics database;
- future charts require accessible table alternatives.

### Optional modules and startup budget

Optional/gameplay modules remain lazy unless measurement proves otherwise.

Current startup architecture remains one eager local stylesheet plus seven eager local scripts.

Do not enlarge startup bundles or make external media eager merely because later features are added.

### Presentation and rights

- FIFA 17 inspiration remains original and rights-safe;
- do not bundle copied EA/FIFA interface artwork, proprietary FIFA fonts, copied menu audio, or official club crests by default;
- licensed local photography keeps provenance;
- mobile, Chromebook, keyboard, touch, and reduced motion remain first-class targets.

## 6. Current football visual authority — v1.1.1 maintenance candidate

James Rodríguez:

- asset: `assets/football/james-rodriguez-real-madrid-2016-smart-v111.webp`;
- source: Real Madrid-authored `James Rodríguez in September 2016 - 02.jpg`;
- license: CC BY 3.0;
- source/full-frame policy: `[0, 0, 863, 1080]`;
- output: `863 × 1080`;
- source/output SHA-256 fingerprints are locked in `assets/football/asset-manifest.json` and `RELEASE_V1.1.1.md`;
- runtime shows the complete derivative with `object-fit: contain`, zero declared crop, clean-anchor layering and face-safe lower accent geometry;
- replaced 2019 James runtime derivative must not return.

Marcus Rashford:

- asset: `assets/football/marcus-rashford-man-utd-2017-smart-r5.webp`;
- final source: Manchester United v RSC Anderlecht, 20 April 2017;
- authored source crop: `[1050, 300, 2350, 2200]`;
- output: `753 × 1100`;
- desktop Transfer media stage: `34%`;
- 701–1020 windowed media stage: `40%`;
- small phones stack Transfer panels vertically;
- runtime shows the full authored derivative with `object-fit: contain`.

Anthony Martial:

- asset: `assets/football/anthony-martial-man-utd-2016-smart-r5.webp`;
- source: Manchester United v Zorya Luhansk, September 2016;
- authored source crop: `[0, 0, 1800, 2400]`;
- output: `825 × 1100`;
- desktop Transfer media stage: `36%`;
- 701–1020 windowed media stage: `42%`;
- small phones stack Transfer panels vertically;
- runtime shows the full authored derivative with `object-fit: contain`.

Marco Reus remains the protected Home/loading identity. Messi and Lahm remain their protected crop-safe assets.

Do not return automatically to rejected r3/r4 treatments, the replaced 2019 James runtime source, or the rejected intermediate 2016 Rashford candidate. Current source/photo derivatives remain authority unless new owner evidence requires another source change.

## 7. r5 proof that does not need to be repeated without new evidence

PR #11 final pre-merge head:

`1f5977e8d175c2baa2ae9f657fc5ff47b2f2ffa6`

Runtime merge:

`8f4f9d2c94e1e1f03f50fb439df34f423cc06d1e`

Pages deployment ID for the r5 runtime merge:

`5850071239`

Before merge, all eleven permanent workflows passed on the exact frozen candidate SHA.

After merge, Licensed Football Visuals passed again.

After merge, Stability Lane passed again, including:

- storage/release contracts;
- two consecutive complete Chromium cycles;
- runtime error provenance;
- Home / Marco Reus audit;
- crop-safe football-photo audit;
- exact deployed runtime-byte verification;
- complete deployed gameplay/navigation journey.

Do not burn a new session repeating this proof unless source changed or a new defect is reported.

## 8. Current owner gate — exact decision tree

### Path A — new r5 rejection evidence arrives

Remain in the finite `v1.0.x` visual-acceptance lane.

Required sequence:

1. reproduce the exact device/viewport problem;
2. use the owner screenshot as the control sample;
3. identify the failure class before editing source;
4. distinguish source crop from media-stage geometry, rendering density, overlay/compositing, or responsive layout;
5. preserve accepted gameplay, scoring, storage, routing, Reus, Messi, Lahm, and performance behavior;
6. fix only the reproduced issue;
7. add or strengthen a permanent test for that failure class;
8. validate `1366×768 DPR1`, `940×700 DPR1`, and `390×844 DPR2` where relevant;
9. run permanent workflows on one frozen candidate SHA;
10. merge with expected-head protection;
11. verify exact Pages deployment and deployed-site smoke;
12. keep owner acceptance open until the corrected public build is inspected.

Do not broaden a screenshot-specific rejection into a general redesign unless the owner explicitly asks.

### Path B — owner accepts r5 or explicitly defers visual review

The finite v1.0.x gate exits.

Current milestone becomes:

`v1.1.0 Data Safety and Recovery`

Start Candidate A only.

Do not combine B/C into the first branch merely for convenience.

## 9. Current persistence reality before v1.1

There are exactly three persistent localStorage keys under `js/storage.js` authority:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Current Showdown schema version: `2`.

Current application-preferences schema version: `2`.

Legacy currently compares Showdown IDs as strings and uses `updatedAt` / `completedAt` as revision clues.

Current stability behavior intentionally preserves malformed active/Legacy/preference raw bytes instead of silently deleting them.

That corrupt-data behavior is a design constraint for v1.1, not an implementation accident.

## 10. v1.1 Data Safety — Candidate A

Name:

`Versioned Backup Envelope + Non-Mutating Export`

Goal:

Create a complete, downloadable, human-inspectable local backup without mutating browser storage.

Required payload semantics:

- backup `formatId`;
- backup `formatVersion`;
- application version;
- runtime revision as diagnostic metadata only;
- export timestamp;
- record counts;
- active Showdown when present;
- Legacy history;
- application preferences;
- checksum algorithm metadata;
- deterministic checksum;
- warnings;
- clearly labeled recovery/raw representation when current records are unreadable.

Important distinction:

The checksum is for corruption detection. It is not encryption, authentication, or a tamper-proof signature.

### Candidate A write boundary

Export must perform zero canonical storage writes/removals.

A Candidate A test should fail if the export path calls `localStorage.setItem()` or `localStorage.removeItem()`.

Export must not change:

- active Showdown bytes;
- Legacy bytes;
- preference bytes;
- timestamps;
- Showdown IDs;
- caches;
- current route/state.

### Candidate A source ownership

Canonical reads originate through `js/storage.js`.

A helper module may serialize/checksum/download the envelope, but it must not become a second localStorage authority.

Preferred UI surface:

`js/legacy.js` existing Data Management area.

Reason:

`js/settings.js` already routes Settings → Data Management into Legacy, and Legacy already owns destructive data controls/confirmations.

Do not create a new top-level route solely to host Export Backup unless evidence proves the existing surface cannot support the workflow cleanly.

### Candidate A minimum acceptance set

Before Candidate A can merge, prove at minimum:

1. empty storage export;
2. active-only export;
3. Legacy-only export;
4. preferences-only export;
5. full three-record export;
6. completed active plus matching Legacy is represented intentionally;
7. existing IDs/timestamps survive unchanged;
8. zero storage writes/removals;
9. malformed raw bytes are not erased;
10. checksum verifies;
11. mutated backup content fails checksum verification;
12. readable JSON download succeeds;
13. large Legacy history remains responsive;
14. keyboard/mouse/touch access works;
15. changed Data Management UI passes accessibility/overflow checks;
16. Chromebook and mobile browser paths pass;
17. normal and reduced-motion paths pass;
18. no severe console/runtime/asset regression;
19. existing gameplay/route/storage suites remain green;
20. runtime cache identity advances if runtime bytes change;
21. PR/post-merge checks run on immutable SHAs;
22. Pages deploys the exact merge;
23. public runtime matches merged source;
24. rollback target is recorded.

## 11. Candidate B and Candidate C boundaries

### Candidate B — Import Analysis + Migration Preview

Candidate B is read-only/dry-run.

It owns:

- import size ceiling;
- JSON/format/checksum/schema validation;
- supported historical migrations;
- future-format rejection;
- duplicate/conflict analysis;
- active/Legacy/preferences preview;
- warnings;
- dry-run outcome.

Candidate B performs zero localStorage writes/removals.

Do not implement restore commits in Candidate B.

### Candidate C — Atomic Restore + Recovery UX

Candidate C is the first import stage allowed to write canonical state.

Before any write it must:

- flush pending application writes;
- revalidate analyzed input;
- capture exact raw snapshots of every affected key;
- compute the selected result in memory;
- make active-save replacement explicit;
- make Legacy merge behavior explicit;
- make preference restoration explicit.

All writes remain behind `js/storage.js`.

Any failed write must roll back every affected key.

Cache invalidation, UI refresh, and canonical navigation happen only after successful commit.

Repeated import must be idempotent.

## 12. v1.1 identity boundary

Do not confuse backup identity with the future profile/save-registry redesign.

For v1.1:

- preserve existing Showdown IDs exactly;
- compare existing IDs as strings for compatibility;
- use current timestamps/fingerprints/checksum data for conflict preview;
- do not create manager accounts/profiles;
- do not replace the singleton active-save model;
- do not create cloud revisions/writer IDs.

Those identity changes belong to v1.3.

## 13. Roadmap dependency chain

Approved order:

`v1.0.x Stability / owner visual gate`
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
→ conditional `v3.0 Community/Rankings` decision gate.

Dependency rule:

Cloud and two-device play cannot begin on the current singleton localStorage model.

Export/import and migrations come first.

Stable local identities and a save registry come before cloud state.

Cloud-safe repository/revision/conflict rules come before two-device play.

Public rankings are not an approved milestone without a verification model, privacy/moderation plan, and owner-approved operating budget.

## 14. Later milestone guardrails

### v1.2.0 Installable Offline App

May begin only after v1.1 recovery is reliable.

Do not cache third-party media blindly or reload through unsaved forms.

### v1.3.0 Local Profiles and Save Library

May begin only after export/import/migrations exist.

This is where stable opaque manager/Showdown/Season/content-pack identities and a local save registry belong.

Historical manager-name ambiguity must be solved explicitly; name equality alone is insufficient identity.

### v1.4.0 Legacy 2.0 and Achievements

Achievements are derived recognition only and never alter canonical Season score.

### v1.5.0 Analytics 2.0

Depends on the identity/history model. Charts require accessible table alternatives.

### v1.6.0 Optional Content Packs

Default five-league Showdown remains unchanged. Extra leagues/custom pools are opt-in validated packs.

### v1.7.0 Challenge Studio

Optional objectives remain separate from canonical scoring.

### v1.8.0 Cloud Readiness

No cloud UI. This milestone prepares the repository boundary, migrations, revisions/tombstones, merge rules, privacy/threat model, and local sync simulation.

### v1.9.0 Cloud Backup Beta

Opt-in backup/restore is the first remote value. No realtime rivalry yet.

### v2.0.0 Private QR Paired Two-Device Alpha

Requires reliable remote backup/state/security. The host remains canonical for irreversible progression in the first alpha.

### v2.1.0 Connected Rivalry

Adds reliable shared state, reconnect, two-party confirmations, and deterministic conflicts.

### v2.2.0 Private Sharing and Groups

Read-only revocable completed-Showdown links first; invited groups later. Default remains private.

## 15. Permanent validation expectations

Eleven permanent workflow families currently protect the stable application:

- Validate Static App;
- Validate Home Bootstrap;
- Validate Transfer Workstream;
- Validate Settings Workstream;
- Validate Statistics Workstream;
- Validate Season Review;
- Validate League Confirmation;
- Validate Final Polish;
- Validate V1 Visual Immersion;
- Validate Licensed Football Visuals;
- Validate Stability Lane.

Every meaningful feature release must also consider:

- corrupt storage;
- quota/write rejection;
- rapid input;
- reload;
- browser Back/Forward;
- double-submit behavior;
- normal/reduced motion;
- keyboard/mouse/touch;
- duplicate IDs;
- focus behavior;
- contrast;
- visible overflow;
- local asset failures;
- startup/raw/gzip/runtime budgets;
- exact cache identity;
- exact Pages deployment;
- public deployed-byte verification.

A milestone is not complete because code exists.

## 16. Release definition of done

Before declaring a milestone complete:

1. scope and exclusions are explicit;
2. storage/schema changes have migrations when required;
3. critical/destructive writes have rollback tests;
4. deterministic contracts pass;
5. complete real-browser journeys pass;
6. normal/reduced motion pass;
7. keyboard/mouse/touch critical actions pass;
8. accessibility scans have no serious/critical changed-screen violation;
9. no severe console error, unhandled rejection, duplicate ID, visible overflow, or failed local asset remains;
10. performance/cache identity stays coherent;
11. candidate SHA is frozen;
12. PR checks pass;
13. merge uses expected-head protection for sensitive work;
14. post-merge checks pass on `main`;
15. Pages deploys the exact merge;
16. deployed runtime matches committed source;
17. rollback target is known;
18. project documents state implemented/pending/accepted/next accurately;
19. material visual/interaction changes receive owner browser acceptance in addition to automated evidence.

## 17. Continuous handoff protocol

The owner requires meaningful development actions and substantive chat decisions to be recorded continuously.

Record at minimum:

- exact owner instruction/correction that changed scope;
- branch and PR;
- source authority chosen when documents conflict;
- root cause of meaningful failures;
- implementation decisions future developers could otherwise misread;
- final selected assets/data contracts;
- candidate and merge SHAs;
- CI failure classification: app, test, infrastructure, or owner visual acceptance;
- deployment status/ID where applicable;
- owner acceptance still open versus accepted;
- exact next action.

Do not wait for a context-limit warning to reconstruct this from memory.

For long work, add a dated/phase continuation file or extend the current rolling handoff at meaningful checkpoints.

## 18. Current roadmap/handoff work already completed

Roadmap/handoff deepening PR:

`#12 — docs: deepen post-v1 roadmap and developer handoff`

Final PR head:

`e62165ca7d87d787f1ff683e3748dadb3c67e557`

Merge commit:

`1929e9548a2d0f5b083aa0d9e454c6b9a6fd3a9f`

PR #12 added/updated:

- this canonical Start Here;
- `POST_V1_ROADMAP_EXECUTION.md`;
- current r5-aware `NEXT_TASK.md`;
- detailed roadmap-deepening chronology.

All eleven permanent workflows passed on the final PR head.

Post-merge Licensed Football Visuals passed.

Post-merge Stability Lane passed, including deployed-site smoke.

After that merge, repository discoverability was aligned:

- `README.md` was updated in commit `0f4730b674ee34f95c7387a0d60c983e53be2200` to point directly to this canonical entry path and current r5/v1.1 gate;
- the roadmap-deepening post-merge handoff was updated in commit `b40ff707be42e777d499c21a83f03dcb7ce407db` to record that README alignment.

Those are documentation-only commits. They do not represent a new runtime build.

Always fetch current `main` for the latest documentation head instead of hardcoding an old documentation SHA here.

## 19. Handoff/chronology index

Use these only when deeper archaeology is required:

- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION.md` — detailed recovery from earlier long chats and r3/r4/r5 history;
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION_POST_MERGE.md` — r5 merge/deployment evidence;
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION_ROADMAP_DEEPENING.md` — roadmap archaeology and documentation-development chronology;
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION_ROADMAP_DEEPENING_POST_MERGE.md` — roadmap PR #12 merge, post-merge validation, and repository-entry alignment;
- `POST_V1_ROADMAP_EXECUTION.md` — future release execution map rather than chronology.

Historical chats `Website Creation and Guide` and `Career Mode Showdown Dev` previously reached maximum length. Existing handoffs reconstruct their material project decisions but are not claimed to be byte-for-byte platform exports.

If the owner later supplies the official ChatGPT export, reconcile it for historical precision without allowing older wording to revert newer source authority.

## 20. What a new developer must not do

Do not:

- restart the product architecture;
- rewrite to a framework merely for modernization;
- reopen already-solved r3/r4 photography without new owner evidence;
- claim automated visual success equals owner visual acceptance;
- create a second router;
- create a second persistence authority;
- create a parallel analytics database;
- replace existing Showdown IDs during v1.1;
- jump to profiles/accounts before v1.3;
- jump to cloud before local identity/save-registry/repository foundations;
- jump to two-device play before cloud/security/conflict foundations;
- change canonical scoring through achievements or challenges;
- silently expand the default five-league mode through content packs;
- ship public rankings without the future decision gate;
- weaken quality gates merely because they expose a defect;
- raise performance budgets just to silence a regression;
- hand code to the owner as the primary deliverable when direct GitHub development is available;
- leave the handoff stale after a meaningful decision or deployment.

## 21. Exact continuation sentence for the next session

A fresh developer should be able to summarize the current project correctly as:

`Career Mode Showdown is on v1.0.1 / 1.0.1-r5. The r5 football-photo rebuild is technically complete, merged, deployed, and post-merge green, but owner real-device visual acceptance remains open. New visual rejection evidence stays in the finite v1.0.x lane; owner acceptance or explicit deferral unlocks v1.1.0 Candidate A only: Versioned Backup Envelope + Non-Mutating Export. Current source remains the highest implementation authority, js/screens.js owns navigation, js/storage.js owns persistence, and later PWA/profiles/cloud/two-device milestones remain dependency-blocked.`
