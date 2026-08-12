# Career Mode Showdown — Developer Start Here

Last updated: 2026-08-12
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Purpose: canonical first-read operating guide for a new ChatGPT, Work, or developer session.

This file is intentionally current-facing. Historical release archaeology belongs in the dedicated release/handoff files and in the consolidated master historical handoff.

## 0. Sixty-second project state

Application version: `v1.1.3`

Runtime asset revision: `1.1.3-r1`

Immutable v1.1.3 application runtime authority:

`29760bbf33c974267bd1ad64d0839f73ad8051fa`

As of the 2026-08-12 canonical-bootstrap correction, the documentation-only `main` base was:

`97d4a0391987ad765c19e019e544f6f95126dfb3`

Always fetch current `main` again in a new session. Do not treat the documentation head as the application runtime authority.

Current release state:

- v1.1.3 is complete, merged, deployed, twice-proven in production and protected;
- Candidate A — Versioned Backup Envelope + Non-Mutating Export — is complete and protected;
- Candidate B — Import Analysis + Migration Preview — is complete, deployed, protected and strictly read-only;
- Candidate C — Atomic Restore + Recovery UX — is the only current substantive roadmap task;
- Candidate C is the first stage allowed to commit imported canonical state;
- v1.2.0 remains reserved for Installable Offline App after Candidate C closes v1.1 Data Safety and Recovery.

The owner-mandated `00_HANDOFF_GOLDEN_RULE.md` is permanent policy: every meaningful action, failure, correction, gate, merge, deployment and next-step decision must be recorded continuously in a public repository handoff while work is happening.

## 1. Start every new session in this order

1. Read `00_HANDOFF_GOLDEN_RULE.md`.
2. Fetch current `main` and record its exact SHA.
3. Read this file completely.
4. Read `NEXT_TASK.md` completely.
5. Read the current milestone/dependency sections of `POST_V1_ROADMAP_EXECUTION.md`.
6. Inspect the live source files named by the active task before changing anything.
7. Identify or create the active public rolling handoff before substantial implementation.
8. Use `00_MASTER_DEVELOPER_CONTEXT.md` and the consolidated master historical handoff only when deeper intent, supersession history or prior failure classes materially help.
9. Do not ask the owner to repeat decisions already recorded in current repository authority.
10. For runtime work, create a focused branch from current `main`; keep the candidate scope bounded.
11. Keep the owner informed during long work and record meaningful checkpoints in the repository handoff.

Do not begin by rereading every old chat. The official historical deep-dive has already extracted the relevant project lineage.

## 2. Authority rules

When evidence conflicts:

1. live current source on `main` is implementation authority;
2. a later explicit owner correction or later owner acceptance/rejection evidence can supersede older documentation or earlier developer assumptions;
3. this file and `NEXT_TASK.md` define the normal current-session bootstrap and legal immediate path;
4. `POST_V1_ROADMAP_EXECUTION.md` defines dependency ordering for future milestones;
5. `PROJECT_STATE.md`, release records and current handoffs preserve established contracts and release evidence;
6. older Project Bible documents and historical chats explain intent only where newer source/owner authority has not superseded them;
7. external reviews such as Grok are critique inputs, never implementation authority.

Never satisfy stale documentation by reverting newer verified source. Correct the stale document.

## 3. Product identity and current mode

Career Mode Showdown is a FIFA 17 Career Mode rivalry companion, not a browser football simulator and not a generic public competition platform.

Current product mode:

- exactly two managers;
- both managers play their own FIFA 17 Career Mode saves outside the website;
- one browser/device;
- one active local Showdown;
- manual FIFA 17 result entry;
- localStorage persistence;
- static HTML/CSS/vanilla JavaScript SPA;
- GitHub Pages hosting.

The site adds structure, ceremony, persistence, rivalry history, scoring and FIFA 17-era immersion around those two separate careers.

Current accepted experience includes:

- Home / Continue Career;
- Create Showdown;
- League Wheel;
- explicit League Selected checkpoint;
- explicit Continue to Club Assignment;
- Club Assignment / sealed two-pack reveal;
- one permanent same-league/different-club rivalry pair;
- Rivalry Confirmation;
- Showdown Home;
- Transfer Window;
- Guess Entry;
- Signing Entry;
- Transfer Verdicts;
- Season Results;
- Season Review / Edit / Confirm;
- Season Summary;
- Rivalry Statistics;
- Career Statistics;
- Legacy;
- Trophy Room;
- Rule Book;
- Settings;
- Smart Back;
- diagnostics/stability behavior;
- lazy optional modules;
- user-initiated Home media.

Immersion is functional product value. Loading presentation, FIFA-era menu rhythm, club reveal suspense, route photography and rivalry framing should not be discarded as cosmetic bloat. They must coexist with performance, accessibility, rights safety and data integrity.

## 4. Locked competition rules

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
- default League Wheel remains Premier League, LaLiga, Bundesliga, Serie A and Ligue 1;
- Transfer Challenge remains maximum three signings each and three opponent guesses;
- guess type remains League or Nationality;
- a correctly guessed signing is released;
- manual FIFA 17 results remain authoritative.

Do not let achievements, Challenge Studio, analytics, content packs, cloud features or future online play change canonical max-11 Season scoring.

## 5. Architecture ownership map

### Navigation and route history

Authority: `js/screens.js`

Rules:

- sole route/history authority;
- Smart Back stays centralized;
- feature modules do not create parallel route history;
- Settings remains modal/lazy rather than a second router;
- Season Review remains ephemeral rather than a persisted route;
- critical writes must complete or roll back before legal route departure.

### Persistence

Authority: `js/storage.js`

Rules:

- sole public persistence authority;
- feature modules do not become direct localStorage owners;
- critical writes save first and rollback/block on failure;
- drafts remain debounced/deduplicated;
- malformed storage bytes are preserved rather than silently erased;
- backup/import/restore extends storage authority rather than creating a second persistence system.

Current canonical localStorage keys:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Current Showdown schema: `2`.

Current preferences schema: `2`.

Current Showdown IDs remain persisted string-compatible values created from the existing model. Do not retrofit v1.3 opaque identity/save-registry work into Candidate C.

### Canonical Showdown model

Authority: `js/showdown.js`

Preserve the exactly-two-manager, permanent-club, current schema and Season progression contracts.

### Scoring

Authority: `js/scoring.js`

The max-11 rules and 0–0-only tiebreak behavior are locked unless the owner explicitly changes competition design.

### Analytics

Authority: `js/analytics.js`

Statistics remain derived. Do not create a parallel persistent analytics database. Future charts require accessible table alternatives.

### Optional modules / startup

Optional feature modules remain lazy unless measurement proves otherwise.

The protected immediate shell remains one eager local stylesheet plus seven eager local scripts. Do not make Candidate C eager simply because restore is important.

### Presentation / rights

- FIFA 17 inspiration remains original and rights-safe;
- do not bundle copied EA/FIFA interface artwork, proprietary FIFA fonts, copied menu audio or official club crests by default;
- local licensed photography keeps source/license/provenance records;
- mobile, Chromebook/windowed desktop, keyboard, touch and reduced motion remain first-class targets.

## 6. Current v1.1.3 visual authority

The active licensed route-scoped visual system contains twelve local derivatives across eleven destination screens.

Current destinations:

- Create Showdown — James Rodríguez, 2014 FIFA World Cup;
- Transfer Challenge — Marcus Rashford, Manchester United vs Chelsea, April 2017;
- Transfer Challenge — Anthony Martial, Manchester United / Champions League 2017;
- League Wheel — Cristiano Ronaldo, Euro 2016;
- Club Assignment — Paul Pogba, Manchester United 2016;
- Showdown Home — Zlatan Ibrahimović, Manchester United 2016;
- Season Results — Antoine Griezmann, Champions League 2016;
- Season Summary — Neymar, Rio 2016 Olympic final;
- Legacy — Radamel Falcao, 2012 Europa League title celebration;
- Rule Book — Mario Balotelli, Euro 2012 semifinal celebration;
- Career Statistics — protected Lionel Messi derivative;
- Trophy Room — protected Philipp Lahm derivative.

Current replaced-player filenames include:

- `assets/football/james-rodriguez-world-cup-2014-v113.webp`;
- `assets/football/marcus-rashford-chelsea-2017-v113.webp`;
- `assets/football/anthony-martial-cska-2017-v113.webp`.

Marco Reus remains the protected Home/loading identity.

Use `assets/football/asset-manifest.json` and `CAREER_MODE_SHOWDOWN_V1.1.3_POST_MERGE.md` as provenance/release authority for the current visual archive.

Do not revive rejected r3/r4/r5 or v1.1.1 James/Rashford/Martial runtime derivatives because older handoffs mention them. v1.1.3 explicitly replaced all three sources and the forbidden-archive validation removed superseded active binaries.

Visual engineering rules recovered from previous failures:

1. high native resolution alone does not guarantee a good UI source;
2. evaluate the actual destination geometry and subject dominance;
3. author local derivatives intentionally;
4. avoid a second blind responsive crop of an already-composed derivative;
5. keep decorative geometry behind/beside important facial geometry;
6. automated visual green is not the same as owner art-direction acceptance;
7. do not weaken composition/occupancy thresholds merely to make CI green.

## 7. v1.1.3 release proof that is already closed

Frozen official pre-merge candidate:

`49fa0496453b3235de0cd87350945fbaedc4291a`

Runtime merge / immutable production authority:

`29760bbf33c974267bd1ad64d0839f73ad8051fa`

v1.1.3:

- fixed the League Wheel post-selection apparent reroll without changing random selection semantics;
- replaced James/Rashford/Martial sources and added seven additional cinematic/historic visuals;
- passed all thirteen permanent gate families twice on one frozen pre-merge candidate;
- merged with expected-head protection;
- deployed successfully on GitHub Pages after an external same-SHA Pages retry;
- passed all thirteen permanent gate families twice again on the immutable production runtime;
- passed exact deployed byte parity, runtime provenance, Home/Reus, licensed visuals, Candidate A export, Candidate B analysis and the complete public journey;
- produced 44 responsive licensed-visual screenshots per production visual execution, with byte-identical evidence across the two production passes.

Protected eager startup measurement:

- raw: `164,965` bytes;
- gzip: `37,006` bytes.

Unchanged ceilings:

- raw: `165,000` bytes;
- gzip: `37,500` bytes.

Do not rerun old visual/source selection work without new owner evidence. Do not raise startup ceilings merely to fit later code.

See `CAREER_MODE_SHOWDOWN_V1.1.3_POST_MERGE.md` for exact workflow IDs, Pages retry evidence and diagnostic history.

## 8. Permanent validation families

The current protected release uses thirteen permanent gate families:

1. Home Bootstrap;
2. League Confirmation;
3. Transfer Workstream;
4. Season Review;
5. Statistics Workstream;
6. Settings Workstream;
7. V1 Visual Immersion;
8. Licensed Football Visuals;
9. Final Polish;
10. Static App;
11. Stability Lane;
12. v1.1.3 Release Burn-In;
13. Candidate B Import Analysis.

Candidate C must add dedicated restore contracts/browser evidence without weakening these existing families.

Every meaningful release must consider, as applicable:

- corrupt storage;
- quota/write rejection;
- rapid input / double activation;
- reload;
- browser Back/Forward;
- lifecycle interruption boundaries;
- normal and reduced motion;
- keyboard, mouse and touch;
- duplicate IDs;
- focus behavior;
- contrast;
- visible overflow;
- minimum target sizes;
- local asset failures;
- console/runtime errors;
- startup/raw/gzip/runtime budgets;
- exact cache/runtime identity;
- exact Pages deployment;
- public deployed-byte verification;
- owner visual acceptance separately from machine QA when art direction changed.

A milestone is not complete because code exists.

## 9. v1.1 Data Safety and Recovery — completed stages

### Candidate A — Versioned Backup Envelope + Non-Mutating Export

Candidate A is complete/protected.

It provides:

- versioned human-readable JSON envelope;
- backup format identity/version;
- application/runtime provenance metadata;
- active Showdown, Legacy and preferences;
- SHA-256 corruption detection;
- warnings/recovery representation;
- malformed raw-byte preservation;
- zero canonical storage mutation during export.

The SHA-256 checksum detects corruption/tampering changes in the file. It is not cryptographic authentication/signing because an attacker who can modify the backup can recompute an unsigned checksum.

### Candidate B — Import Analysis + Migration Preview

Candidate B is complete/protected/read-only.

It provides:

- 5 MiB input ceiling;
- strict JSON/format/checksum/schema validation;
- hostile object-key/nesting guards;
- future-format/schema fail-closed behavior;
- deterministic supported Showdown/preferences migrations;
- current active/Legacy/preferences comparison;
- same-ID duplicate/conflict classification using current IDs as strings;
- migration/conflict preview UI;
- zero canonical localStorage writes/removals;
- no network request;
- no restore/apply permission.

`PREVIEW READY` is evidence only. It is never a write token.

## 10. Current substantive task — Candidate C

Name:

`Atomic Restore + Recovery UX`

Candidate C is the first import stage allowed to write canonical state.

The mandatory transaction shape is:

1. flush all pending canonical application writes before restore begins;
2. freshly revalidate the selected/analyzed backup immediately before Apply;
3. rerun supported migrations and current conflict comparison;
4. require explicit user decisions for active Showdown replacement, Legacy merge/conflicts and preference restoration;
5. snapshot exact raw bytes or exact absence for every affected canonical key before first mutation;
6. compute every final candidate value entirely in memory before first write;
7. perform canonical writes only through `js/storage.js` authority;
8. treat the complete multi-key restore as one application transaction;
9. verify every committed key/value after writing;
10. on any write or verification failure, restore every affected key to the exact raw pre-restore bytes/absence;
11. verify rollback byte-for-byte;
12. if rollback itself cannot be verified, surface a critical recovery state rather than pretending recovery succeeded;
13. invalidate caches, refresh global state and navigate only after the complete transaction succeeds;
14. make repeated import deterministic/idempotent;
15. retain corrupt raw-data preservation/recovery semantics;
16. keep recovery/export guidance visible before destructive active replacement;
17. do not introduce a second persistence owner.

Candidate C should remain in the existing lazy Data Management surface unless source/usability evidence proves otherwise.

Current source seams to inspect before implementation:

- `js/storage.js`;
- `js/backup.js`;
- `js/importAnalysis.js`;
- `js/legacy.js`;
- `js/settings.js`;
- `js/optionalModules.js`;
- `js/screens.js`;
- Candidate A/B contracts and browser workflows.

Preferred responsibility split:

- `js/importAnalysis.js` remains read-only analysis/migration authority;
- `js/storage.js` owns raw snapshots, canonical writes, verification, rollback and cache-safe persistence primitives;
- `js/legacy.js` remains the Data Management host;
- a lazy `js/restore.js` is acceptable only if it reduces coupling/test risk rather than creating a second persistence owner;
- `js/screens.js` remains navigation authority.

## 11. Candidate C required failure-injection evidence

A happy-path restore is not sufficient.

Deliberately reproduce/prove recovery from at least:

- first-key write failure;
- middle-key write failure after one earlier key changed;
- final-key write failure;
- quota/storage exception;
- post-write verification mismatch;
- rollback write failure;
- corrupt pre-existing raw bytes;
- same-ID Legacy conflicts;
- rapid/double Apply activation;
- stale analysis / backup changed between preview and Apply;
- current local state changed between preview and Apply;
- repeated import of the same already-restored backup;
- page lifecycle interruption boundary where technically reproducible.

Web Storage writes are synchronous, so do not invent guarantees that cannot be reproduced. Keep expensive/async checksum/file analysis before a short storage-owned commit/verify/rollback boundary.

## 12. Candidate C UX/accessibility requirements

The restore UI must clearly separate:

- current local state;
- analyzed backup state;
- user-selected resolution choices;
- what will be replaced;
- what will be merged;
- what will remain unchanged;
- revalidation state;
- restore-in-progress state;
- success state;
- rolled-back failure state;
- rollback-failed critical recovery state.

Required changed-screen evidence includes:

- keyboard;
- mouse;
- touch;
- Chromebook standard desktop;
- approximately 940px windowed/low-height desktop;
- 390×844 DPR2 mobile;
- normal motion;
- reduced motion;
- focus movement/restoration;
- axe/accessibility;
- overflow;
- minimum target size;
- conflict-heavy/long Legacy preview;
- explicit destructive replacement/recovery guidance.

Rapid second Apply activation must be a no-op once one transaction is in flight.

## 13. Bounded live-source observation to recheck

During the 2026-08-12 historical deep-dive, `js/settings.js` contained a degraded/isolation fallback string `"1.1.2"` inside `getSettingsApplicationVersion()` while normal eager `js/app.js` correctly defined `APP_VERSION = "1.1.3"`.

Normal application execution therefore receives 1.1.3. The historical docs-only work intentionally did not alter runtime JavaScript.

Before Candidate C implementation, recheck current source. If the stale fallback still exists, classify it as a small release-coherence maintenance defect rather than silently using it to broaden Candidate C architecture or change application version.

## 14. Roadmap dependency chain after Candidate C

Approved dependency order:

`v1.1 Candidate C — Atomic Restore + Recovery UX`
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
→ conditional `v3` Community/Rankings decision gate.

Why the order matters:

- reliable export/import/restore precedes structural migration;
- PWA/offline install comes after recovery so local data is not stranded by runtime/cache problems;
- stable opaque identities/save registry precede richer history, advanced analytics and cloud conflict semantics;
- cloud-readiness architecture, revisions/tombstones/privacy/threat model precede remote backup;
- remote reliability/security precede two-device shared state;
- private connected use precedes private sharing/groups;
- public rankings remain conditional because manually entered FIFA results are not globally verifiable without a separate verification model.

Do not jump ahead.

## 15. Release definition of done

Before declaring a milestone complete:

1. scope and exclusions are explicit;
2. active public handoff exists from the beginning;
3. storage/schema changes have ordered migrations when required;
4. critical/destructive writes have failure and rollback tests;
5. deterministic contracts pass;
6. complete real-browser journeys pass;
7. normal/reduced motion pass;
8. keyboard/mouse/touch critical actions pass;
9. accessibility scans have no serious/critical changed-screen violation;
10. no severe console error, unhandled rejection, duplicate ID, visible overflow or failed local asset remains;
11. startup/performance/cache identity stays coherent;
12. one exact candidate SHA is frozen;
13. diagnostic/fix runs are not counted as official release proof;
14. permanent PR gates run on the frozen candidate without threshold weakening;
15. sensitive merge uses expected-head protection;
16. post-merge gates pass on the exact production runtime;
17. Pages deploys the exact merge;
18. deployed runtime bytes match committed runtime source;
19. rollback target is known;
20. project documents accurately state implemented/pending/accepted/next;
21. material visual/interaction changes receive owner browser acceptance in addition to automated evidence.

For releases following the established double-proof pattern, run the required permanent family matrix twice on the same frozen pre-merge candidate and twice again on the immutable production runtime when `NEXT_TASK.md`/release authority requires it.

## 16. Continuous handoff protocol

Record at minimum:

- exact owner instruction/correction that changed scope;
- branch/base/runtime authority;
- current implementation milestone;
- source authority chosen when documents conflict;
- important architecture/data-model decisions;
- rejected candidates/failed experiments;
- meaningful CI/test failures and classification: app, test, infrastructure or owner visual acceptance;
- corrective changes and why they are safe;
- thresholds/budgets deliberately preserved;
- final selected assets/data contracts;
- candidate and merge SHAs;
- PR number and exact PR head;
- deployment status/ID/SHA;
- public Pages verification;
- owner acceptance still open versus accepted;
- exact next legal action.

Do not wait for a context-limit warning to reconstruct this from memory.

## 17. Historical/deep-context index

Normal continuation should remain source-first and concise.

When deeper historical intent is needed, start with:

- `00_MASTER_DEVELOPER_CONTEXT.md` — stable deep-context entry point;
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPER_HANDOFF_FINAL_2026-08-12.md` — preferred single consolidated historical/current deep read;
- `CAREER_MODE_SHOWDOWN_HISTORICAL_OWNER_DECISION_INDEX_2026-08-12.md` — source-indexed high-value owner decisions;
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPER_HANDOFF_RESEARCH_COMPLETION_2026-08-12.md` — exact export/message-count audit, precision corrections and non-implemented live-source observations;
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPER_HANDOFF_2026-08-12_ROADMAP_AND_REVIEW_APPENDIX.md` — Grok critique, dependency reasoning and Candidate C protocol;
- `AI_DEVELOPER_AUDIT_2026-08-10_VISUAL_REGRESSION.md` — r3 visual failure/gate-design lesson;
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION*.md` — r4/r5 and roadmap chronology when exact archaeology is required;
- `CAREER_MODE_SHOWDOWN_V1.1.3_POST_MERGE.md` — current release proof;
- Candidate A/B release and post-merge handoffs — current data-safety stage history.

The official Aug 10 ChatGPT export was already reviewed narrowly for the relevant project conversations. `Project r4 Visual Fixes` post-dates that export, so its history is reconstructed from repository-native evidence rather than falsely claimed raw-chat access.

Historical records never override later verified source or a later explicit owner correction.

## 18. What a new developer must not do

Do not:

- restart product architecture;
- restart planning loops when the current milestone is already defined;
- rewrite to React/Vue/Svelte or TypeScript merely for modernization/prestige;
- create a second router;
- create a second persistence authority;
- mutate Candidate B into restore authority;
- let a Candidate B preview act as stale write permission;
- normalize current corrupt raw bytes before Candidate C snapshots them;
- partially refresh caches/UI after only some restore keys succeed;
- report restore success without post-write verification;
- report rollback success without rollback verification;
- replace existing Showdown IDs during Candidate C;
- jump to PWA before Candidate C closes v1.1;
- jump to profiles/save registry before v1.3;
- jump to cloud before local identity/repository/conflict foundations;
- jump to two-device play before remote reliability/security foundations;
- change max-11 scoring through achievements/challenges;
- silently expand the canonical five-league default through content packs;
- ship public rankings without the future verification/privacy/moderation/budget decision gate;
- revive rejected James/Rashford/Martial photo sources from older handoffs;
- claim automated visual green equals owner art-direction acceptance;
- weaken quality gates merely because they expose a defect;
- raise startup budgets just to silence a regression;
- rely on external Grok claims when current repository evidence contradicts them;
- hand fragile partial-file splice instructions to the owner as the primary implementation method when direct GitHub work is available;
- leave the public handoff stale after a meaningful decision, failure, merge or deployment.

## 19. Exact continuation sentence for the next session

A correctly oriented fresh developer should be able to state:

`Career Mode Showdown is on protected v1.1.3 / 1.1.3-r1. The immutable application runtime is 29760bbf33c974267bd1ad64d0839f73ad8051fa. Candidate A export and Candidate B read-only import analysis are complete, merged and protected. Candidate C — Atomic Restore + Recovery UX — is the only current substantive roadmap task and the first stage allowed to write imported canonical state. Candidate C must freshly revalidate before Apply, collect explicit restore choices, snapshot exact raw bytes/absence for every affected canonical key, compute the whole result in memory, write only through js/storage.js authority, verify the full multi-key commit, roll back every affected key byte-for-byte on any failure, verify rollback, and update caches/navigation only after complete success. v1.2 PWA, v1.3 profiles/save registry, cloud and two-device work remain dependency-blocked. The v1.1.3 route-scoped football visual archive and protected Marco Reus presentation remain current authority, while rejected older player-photo sources must not return. Continuous public handoff recording remains mandatory.`

If a future developer cannot confidently make that statement after reading current source, this file and `NEXT_TASK.md`, they are not ready to begin Candidate C implementation.
