# PROJECT STATE — Career Mode Showdown

## Authority / continuation rule

This project is already designed and implemented through Candidate C Atomic Restore + Recovery UX. The current work is v1.1.4 release closure, not a new planning cycle.

Authority when sources disagree:

1. current source on the active release/integration branch, and `main` after merge;
2. explicit later owner decisions/amendments;
3. `PROJECT_STATE.md`;
4. `ROADMAP_AMENDMENTS.md`;
5. `NEXT_TASK.md`;
6. release/handoff documentation;
7. original Project Bible / architecture documents;
8. older historical records/conversations.

Current source is implementation authority. Browser acceptance remains required for visual/interaction work after machine validation.

Do not revert working systems because an older document describes an earlier release. Do not call a release deployed merely because a branch is green.

---

# Current implementation

**Application version:** v1.1.4 — Candidate C Atomic Restore Release Candidate
**Runtime asset revision:** `1.1.4-r1`
**Hosting:** GitHub Pages
**Technology:** static HTML + CSS + vanilla JavaScript + browser localStorage
**Product mode:** exactly two managers, one device/browser, one active Showdown
**Current milestone:** v1.1 Data Safety and Recovery — Candidate C IMPLEMENTED / PRE-MERGE RELEASE VALIDATION
**Current activity:** finish v1.1.4 release identity/document/gate coherence, freeze PR #24 on one SHA, prove it, merge with expected-head protection and prove public Pages
**Current public production:** v1.1.3 / `1.1.3-r1`
**Immutable v1.1.3 runtime authority:** `29760bbf33c974267bd1ad64d0839f73ad8051fa`
**Candidate C integration PR:** #24 — `agent/candidate-c-atomic-restore`
**Release preparation branch:** `agent/v1.1.4-release-freeze`
**Last fully proven pre-release-identity Candidate C head:** `cf231ec99399837369a53fc5a703f93aec99dcb6`
**Protected loading-screen status:** owner explicitly likes the loading presentation; composition and timing remain regression-protected
**Next roadmap milestone after v1.1.4 deployment proof:** v1.2.0 — Installable Offline App

The isolated release-freeze branch must remain a fast-forward descendant of the proven Candidate C implementation. Release-freeze work may align package/cache identities, validators, contracts and current authority documentation, but it must not silently redesign Candidate C or unrelated gameplay.

---

# Current product flow

Main Menu  
→ Create Showdown  
→ League Wheel  
→ League Selected checkpoint  
→ explicit CONTINUE TO CLUB ASSIGNMENT  
→ League Confirmed checkpoint  
→ Club Assignment / Two-Pack Reveal  
→ explicit Rivalry Confirmation  
→ Showdown Home  
→ Transfer Window  
→ Guess Entry  
→ Signing Entry  
→ Transfer Verdicts  
→ Season Results  
→ Season Review  
→ Edit Results OR Confirm & Save  
→ Season Summary  
→ next Season / completed Showdown  
→ Legacy / Statistics / Trophy Room

Legacy / Data Management additionally owns Candidate A backup export, Candidate B read-only import analysis and Candidate C restore/recovery.

---

# Locked competition rules

These are not release-freeze variables:

- exactly two managers;
- Showdown lengths `[1,3,5,10]`;
- both managers use the same selected league;
- clubs are different and permanent for the complete Showdown after confirmation;
- Champions League winner = 5 points;
- domestic league winner = 3 points;
- main domestic cup winner = 1 point;
- 100 league points and/or 100 league goals share one +1 performance bonus;
- Top Scorer and/or Top Assist share one +1 individual-awards bonus;
- maximum season score = 11;
- equal non-zero season scores remain a draw;
- only a 0–0 season uses tiebreakers: better league position, then league points;
- League Wheel selection must not auto-enter Club Assignment;
- club assignment must not start the rivalry until explicit confirmation.

---

# Core authority boundaries

## Routing

`js/screens.js` remains route/history authority. Feature modules must not create competing route stacks or direct historical state.

Smart Back remains centralized. Feature-level controls that are not actual route Back controls must not use router-reserved Back classifications.

## Persistence

`js/storage.js` remains canonical storage authority for active Showdown, Legacy and application preferences. Direct localStorage access outside storage authority/diagnostics is regression-protected.

Candidate C may perform a multi-key transaction, but it does not create a second independent persistence model. `js/storageTransaction.js` is a bounded transaction mechanism used by the restore engine under existing storage ownership.

## Lazy runtime

The startup shell remains one local stylesheet + seven local scripts. Heavy gameplay, Transfer, Season Review, analytics, Settings, football visuals and Data Management are lazy.

Candidate C transaction, planner, UI and restore CSS must remain lazy inside Legacy / Data Management and must not increase eager startup dependencies.

## External media

Menu YouTube media is user-initiated and stays outside the critical startup path. Licensed football photography is local and route-owned. Home startup must not preload the complete football-photo archive.

---

# v1.1.4 — Candidate C Atomic Restore + Recovery UX

Candidate C completes the planned v1.1 Data Safety and Recovery sequence.

Candidate A remains non-mutating export. Candidate B remains read-only analysis/migration/conflict preview. Candidate C is the first stage allowed to apply imported canonical data after fresh revalidation and explicit choices.

## Atomic transaction sequence

1. flush all pending canonical writes before restore;
2. revalidate the selected/analyzed backup immediately before Apply, including size, format, checksum, schemas, migrations and unresolved conflicts;
3. snapshot exact raw bytes/absence for every affected key before the first mutation;
4. require explicit active/Legacy/preferences resolution choices;
5. compute every final candidate value in memory before the first write;
6. keep mutation under existing storage authority;
7. commit affected keys in deterministic active → Legacy → preferences order;
8. verify every written key/value after commit;
9. if any write or verification fails, restore every affected key to its exact raw snapshot;
10. verify rollback byte-for-byte;
11. if rollback cannot be proven, enter a locked critical recovery state rather than claiming recovery;
12. synchronize in-memory/runtime state only after the complete transaction succeeds;
13. repeated import must be deterministic/idempotent;
14. corrupt raw local bytes remain preserved instead of being silently erased.

## Restore UX

The Data Management surface must visibly distinguish:

- current state;
- analyzed backup state;
- user choices;
- planned changes;
- destructive confirmation;
- applying state;
- success;
- verified rollback and deliberate retry;
- critical rollback failure and control lock.

Export Backup remains available above restore. The file picker has a 44 px minimum touch target. Desktop/Chromebook, mobile 390×844 DPR2, reduced motion, focus, overflow and fixed-footer-safe scrolling are permanent browser requirements.

## Candidate C failure evidence

Permanent deterministic/browser gates deliberately include:

- first-key write failure;
- middle-key write failure;
- final-key write failure;
- quota/storage exception;
- post-write verification mismatch;
- rollback failure;
- absent raw keys;
- corrupt pre-existing bytes;
- same-ID Legacy conflicts;
- stale reviewed state;
- rapid/double Apply;
- lifecycle interruption before the synchronous transaction boundary;
- repeated import/idempotence;
- critical recovery control lock;
- responsive/touch/accessibility evidence.

The dedicated browser lane uses isolated browser processes for destructive failure scenarios and runs eight scenarios per pass, twice.

## Candidate C defects reproduced and fixed

The deepened gates found four real defects:

1. Apply refreshed live storage before confirmation and could bypass explicit stale-state feedback. The reviewed snapshot is now preserved through confirmation and authoritative post-flush stale validation decides whether Apply can proceed.
2. Safe rollback proof was immediately erased by a final refresh. Verified rollback now remains visible/retryable; unverified rollback enters a locked critical state.
3. Reusing a Chromium process after injected storage failures contaminated later destructive scenarios. Each destructive scenario now receives an isolated browser process.
4. The restore file picker was only 40 px high on 390×844 DPR2. It now has an explicit 44 px minimum height with border-box sizing.

Static hardening protects these bug classes from returning.

---

# Candidate C pre-release proof

Before the v1.1.4 identity/document freeze, exact head `cf231ec99399837369a53fc5a703f93aec99dcb6` was green across all existing permanent families.

Candidate C-specific proof on that implementation/gate baseline includes:

- deterministic restore contracts green;
- dedicated Candidate C real-browser audit green twice;
- eight isolated destructive/recovery scenarios per pass;
- expanded Stability Lane green across two consecutive Chromium cycles with restore included;
- Candidate C-inclusive five-pass Burn-In green 5/5;
- older protected feature/workstream families green.

This is implementation/gate evidence, not public deployment proof for v1.1.4.

The final release must still freeze one exact PR SHA, pass the full permanent-family matrix twice as required, merge safely, wait for Pages revision convergence, verify exact runtime bytes and pass deployed Candidate A/B/C plus complete journey evidence.

---

# Permanent release infrastructure

The repository owns its release evidence. Important permanent families include:

- Static App;
- Transfer Workstream;
- Season Review;
- Settings Workstream;
- League Confirmation;
- Home Bootstrap;
- V1 Visual Immersion;
- Licensed Football Visuals;
- Statistics Workstream;
- Final Polish;
- Candidate B Import Analysis;
- Candidate C Atomic Restore;
- Stability Lane;
- five-pass Candidate C Release Burn-In.

The Stability Lane runs repository contracts and two consecutive real Chromium cycles. Candidate C restore/recovery is part of those cycles. On `main`, Stability additionally waits for Pages, verifies every runtime file byte-for-byte and reruns runtime provenance, Home, licensed visuals, Candidate A export, Candidate B analysis, Candidate C restore and the complete public journey.

The release Burn-In runs five complete independent passes and includes Candidate C recovery in every pass.

Do not lower thresholds to obtain green status. A failing deeper gate is a bug report until evidence shows otherwise.

---

# Protected performance / visual baseline

The accepted v1 presentation remains FIFA-17-era influenced but original project work. No EA/FIFA logo, proprietary interface bytes or official club badges are bundled.

Protected startup ceilings:

- 165,000 raw eager code bytes;
- 37,500 gzip eager code bytes;
- 95,000 startup Marco Reus portrait bytes;
- 260,000 combined first-party startup bytes.

The Marco Reus loading presentation remains protected. Current normal startup minimum is 2700 ms; reduced-motion minimum is 220 ms. The application remains inert/aria-hidden until startup dismissal.

Licensed football photos use local derivatives, provenance records and crop-safe/face-safe presentation. v1.1.3 route-scoped loading and zero Home-startup football-photo requests remain protected.

---

# Completed release lineage

## v1.1.3 — League Wheel Stability + Cinematic Football Visual Expansion

Current public production until Candidate C merges. Fixed the post-selection League Wheel transform-normalization reroll and expanded/replaced licensed football photography without changing gameplay or persistence semantics. Merged/deployed/twice-proven. Runtime authority `29760bbf33c974267bd1ad64d0839f73ad8051fa`.

## v1.1.2 — Candidate B Import Analysis + Migration Preview

Read-only local backup analysis, schema/migration preview and conflict classification. Zero canonical writes/removals.

## v1.1.1 — James Rodríguez source maintenance

Bounded source-photo replacement while preserving clean-anchor/crop-safe architecture.

## v1.1.0 — Candidate A Backup Export

Versioned, SHA-256-protected human-readable local backup export without canonical mutation.

## v1.0.2 — Clean-anchor football-photo maintenance

Established player-first clean-anchor presentation and protected the accepted loading screen.

## v1.0.1 — Stability hardening

Added repository-owned browser/axe/corrupt-data/quota/deployment-byte evidence and the permanent Stability Lane.

## v1.0.0 — Version 1 stable

Sealed the accepted Home/loading/competition baseline.

Earlier implementation and r-series history remains available in the Project Bible, release records, master continuation documents and historical handoffs. It is history, not current implementation authority.

---

# Current release gate

v1.1.4 is not yet deployed/proven.

Immediate legal work is only:

1. finish current v1.1.4 release coherence;
2. move PR #24 to one coherent frozen SHA;
3. pass every permanent family on that same SHA;
4. obtain the required second independent same-SHA proof;
5. inspect Candidate C visual artifacts;
6. merge with expected-head protection;
7. wait for public Pages `1.1.4-r1`;
8. require exact deployed runtime-byte parity and deployed browser/recovery proof;
9. repeat required production proof;
10. seal final authority/handoff evidence.

Do not begin v1.2.0 before those steps close.

---

# Next roadmap boundary

v1.2.0 remains reserved for Installable Offline App.

Profiles/save registry, cloud/accounts, QR pairing and two-device work remain dependency-blocked behind v1.1.4 deployment proof.

See `NEXT_TASK.md`, `RELEASE_V1.1.4.md`, `CAREER_MODE_SHOWDOWN_V1.1.4_RELEASE_HANDOFF.md` and `POST_V1_ROADMAP_EXECUTION.md` for the current continuation path.
