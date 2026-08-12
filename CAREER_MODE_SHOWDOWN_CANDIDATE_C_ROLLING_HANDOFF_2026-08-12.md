# Career Mode Showdown — Candidate C Rolling Handoff

Date: 2026-08-12
Status: ACTIVE — Candidate C pre-implementation / implementation continuity
Branch: `agent/candidate-c-atomic-restore`
Base `main`: `6b49a7987ff2251f008af92eee31bdf8f734d6ee`
Immutable protected v1.1.3 application runtime: `29760bbf33c974267bd1ad64d0839f73ad8051fa`
Current released app: `v1.1.3` / runtime revision `1.1.3-r1`
Next legal substantive milestone: Candidate C — Atomic Restore + Recovery UX

## Owner instruction being continued

Continue from the completed `Project r4 Review Completion` / master-handoff work, deepen understanding of the project’s historical documents and relevant project chats, verify the relevant conversation lineage, and use the deepest roadmap/source understanding possible before and while moving into Candidate C. Keep recording all meaningful actions, findings, lessons and decisions in the repository for the next developer.

The owner explicitly does not want shallow re-planning or a restart. Historical study exists to improve implementation accuracy and prevent regressions.

## Current authority / clean baseline

The previous handoff phase is closed and protected.

- final canonical-bootstrap documentation seal on `main`: `6b49a7987ff2251f008af92eee31bdf8f734d6ee`;
- immutable v1.1.3 application runtime: `29760bbf33c974267bd1ad64d0839f73ad8051fa`;
- Candidate A export: complete/protected;
- Candidate B import analysis: complete/protected/read-only;
- Candidate C: not previously implemented; no partial restore transaction exists;
- protected eager release size remains `164,965` raw / `37,006` gzip under unchanged `165,000` / `37,500` ceilings.

This Candidate C branch starts from the clean documentation-seal head. It must preserve v1.1.3 runtime behavior until deliberate Candidate C changes are introduced and tested.

## Historical conversation verification completed before Candidate C coding

### A. Official export-backed foundational conversations

The 2026-08-12 master research package was independently rechecked against the official Aug 10 ChatGPT account export.

The export contains 41 numbered conversation JSON volumes and 4,093 conversations total.

Exact high-value project conversations recovered and analyzed:

1. `Website Creation and Guide`
   - conversation ID `6a6ba895-cb1c-83ea-b13c-d7e3d42afb25`;
   - 439 active-path text-bearing messages;
   - 176 owner/user text-bearing turns;
   - primary authority for original product intent, owner rule corrections, early interaction architecture, FIFA 17 presentation intent, performance priorities, Chromebook constraints, handoff/anti-loop failure history and the path into the v0.95 workstream program.

2. `Career Mode Showdown Dev`
   - conversation ID `6a78bb0e-d2ac-83ea-b092-7c9377a6dda1`;
   - 314 active-path text-bearing messages;
   - 19 owner/user turns;
   - primary authority for source-first continuation discipline, browser-first release engineering, direct GitHub PR/merge/deploy expectations, stable-release quality gates, Reus/loading priorities and critical use of external Grok review.

3. `Career Mode Showdown — Master Development Continuation`
   - conversation ID `6a79ea21-093c-83ea-b00d-055524fb259a`;
   - 30 active-path text-bearing messages;
   - 11 owner/user turns;
   - primary authority for recovering quality across Work/context interruption, the Reus diagnosis reclassification after screenshots, the broader visual request, roadmap recovery and the explicit owner request to fully study the earlier max-length chats.

### B. Project-folder process/history conversations

Additional project-folder conversations were separately classified so their process lessons are not confused with current gameplay authority:

- the v0.6.1 / Project Bible / onboarding phase established `do not restart planning`, inspect existing source, preserve architecture, complete-file/direct-repo workflow, focused milestones and source/document synchronization;
- the AI Developer Onboarding Protocol sharpened the authority hierarchy: current source first, then current state/task/architecture documentation, with implementation rather than repetitive planning as the default;
- the Work-usage-reset / continuity discussion added no new gameplay rules but materially explains why repository-owned handoffs, source inspection and test evidence must carry quality across environment/context changes;
- `Project r4 Visual Fixes` post-dates the Aug 10 export and therefore cannot honestly be claimed as a raw-export transcript. It is reconstructed from repository-native rolling handoffs, incident reports, PR/release evidence, owner rejection/acceptance records and current visual authority;
- `Project r4 Review Completion` is represented by the v1.1.3 closure, historical-deep-dive package, canonical-bootstrap correction and final seal that immediately precede this branch.

Adjacent conversations such as generic FIFA player rankings or unrelated football-game questions do not establish application architecture or Candidate C requirements and are intentionally not promoted into project authority.

### C. Historical source limitation preserved

Exact `Project r4 Visual Fixes` title count in the Aug 10 export is zero because that chat occurred after the export snapshot. Do not fabricate raw turn numbers or claim full transcript access that does not exist.

Repository-native evidence is the correct authority for that phase.

## Historical lessons that materially constrain Candidate C

1. Current source wins; history explains causality.
2. Later explicit owner corrections beat earlier assistant plans.
3. Owner real-device/art-direction evidence remains a separate gate from automated visual green.
4. Reproduced broken core flow outranks feature expansion.
5. Data/history preservation is a product value, not backend plumbing; the save system protects the rivalry story.
6. `js/storage.js` was always intended to be the sole local-storage owner. Candidate C must strengthen that rule rather than create a restore-specific second owner.
7. The anti-loop/handoff system exists because context loss actually damaged development continuity earlier; Candidate C must record work as it happens.
8. Performance budgets are requirements. Restore code should remain lazy rather than force an eager-budget increase.
9. Chromebook/windowed desktop, mobile/DPR2, keyboard, touch and reduced motion are first-class acceptance paths.
10. A green gate that misses a real defect should be strengthened, not weakened or discarded.
11. Candidate A/B/C are intentionally separated stages. Candidate B `PREVIEW READY` is evidence only and cannot be converted into a write token.
12. The roadmap is a dependency/risk graph: recovery before PWA/save-registry/cloud/two-device work.

## Roadmap understanding revalidated

Dependency order remains:

`Candidate C / close v1.1 Data Safety and Recovery`
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

Critical dependency reasoning:

- recovery must exist before structural storage/identity migrations;
- PWA comes after recovery so install/cache problems cannot strand local data without a tested escape hatch;
- stable opaque identities/save registry belong to v1.3, not Candidate C;
- cloud needs revisions/conflicts/tombstones/privacy/security/provider decisions, not just a storage adapter;
- two-device play depends on proven remote reliability/security;
- public rankings remain conditional because FIFA results are manually entered and not globally verifiable by the current product.

## Live Candidate C source seam audit

### `js/storage.js`

Current canonical keys:

- `careerModeShowdown.activeShowdown`;
- `careerModeShowdown.legacyShowdowns`;
- `careerModeShowdown.preferences`.

Current private state includes:

- pending active-save timer;
- active save presence cache;
- Legacy cache + revision;
- application preferences cache.

Existing useful primitives:

- exact raw read/write/remove helpers;
- `captureCareerModeRawBackupInputs()` returns exact raw strings or `null` for all three keys;
- `flushPendingApplicationWrites()` flushes Transfer draft + scheduled current save;
- `restoreStorageSnapshot(key, value)` already models exact raw string versus absent key;
- `clearAllCareerModeData()` contains a smaller two-key rollback precedent.

Candidate C implication:

Add a storage-owned raw multi-key transaction API. Candidate C UI/orchestration must not call localStorage directly. The transaction must not use public save helpers that update caches after each individual write, because caches must remain unchanged until the whole commit verifies.

### `js/backup.js`

Candidate A provides:

- format ID/version authority;
- SHA-256 checksum verification;
- canonicalization;
- exact raw recovery representation for corrupt source storage;
- zero canonical mutation during export.

The checksum is corruption/change detection, not authentication/signing.

### `js/importAnalysis.js`

Candidate B is explicitly read-only and already exposes:

- 5 MiB limit;
- hostile-structure guards;
- strict format/checksum/schema validation;
- Showdown schema 1→2 migration;
- preferences schema 1→2 migration;
- deterministic/idempotent migration checks;
- current active/Legacy/preferences comparison;
- conflict categories using Showdown IDs as strings;
- `analyzeCareerModeBackupFile(file)` which rereads the selected File and rebuilds the comparison against current local state each time.

Candidate C implication:

Fresh Apply-time revalidation should call Candidate B analysis again on the currently selected File. Do not trust the previous preview object, and do not change `readyForRestore: false` into a permission flag.

### `js/legacy.js`

Legacy is the natural lazy Data Management host and already owns destructive confirmation UX.

Important nuance discovered:

`renderLegacy()` first calls `archiveCompletedSaveBeforeLegacy()`, which can archive a completed active Showdown before Data Management mounts. Candidate C must therefore treat the current storage state at Apply-time as authority and fresh-reanalyze after flushing pending writes. It must not assume the state that existed before the user opened Legacy is still current.

### `js/optionalModules.js`

Legacy currently lazy-loads:

`backup.js` → `importAnalysis.js` → `legacy.js`.

Candidate C should remain lazy. A dedicated `js/restore.js` is acceptable between analysis and Legacy UI only if it stays orchestration-only and never becomes a second storage authority.

### `js/screens.js`

Navigation/history authority remains centralized.

After successful restore:

- no navigation may happen until storage commit + verification is complete;
- caches/currentShowdown must be synchronized only after transaction success;
- canonical destination must be resolved through `js/screens.js`, not by restore UI directly manipulating screen DOM/history.

### `js/settings.js`

Current source still contains the previously documented degraded/isolation fallback `"1.1.2"` inside `getSettingsApplicationVersion()` while normal eager `APP_VERSION` is 1.1.3.

This is a real bounded release-coherence maintenance defect, not a Candidate C architecture requirement. It may be corrected only as an explicitly recorded tiny coherence fix and must not broaden restore scope.

## Candidate C design boundary now established

### Included

- explicit restore choices for active Showdown, Legacy and preferences;
- fresh Apply-time Candidate B reanalysis;
- deterministic Legacy merge planning;
- exact raw pre-write snapshot;
- storage-owned multi-key commit;
- exact post-write verification;
- complete rollback attempt across every affected key;
- byte-for-byte rollback verification;
- critical recovery state if rollback cannot be verified;
- double-Apply lock;
- cache/current state synchronization only after full success;
- route refresh only through screen authority;
- dedicated deterministic contracts + browser audit/failure injection;
- accessibility/responsive/reduced-motion coverage;
- continuous public handoff and release evidence.

### Explicitly excluded

- PWA/service worker/offline install;
- profiles/save registry/multiple active saves;
- new opaque manager/Showdown/Season identity scheme;
- cloud/network/account work;
- QR/two-device work;
- gameplay/scoring changes;
- League/Club/Transfer/Season semantics changes;
- analytics redesign;
- visual-source changes;
- framework/TypeScript modernization;
- a new fourth canonical data key/transaction journal unless a later reproduced requirement proves it necessary and roadmap authority is revisited.

## Proposed responsibility split

### `js/importAnalysis.js`

Remain strictly read-only. Continue providing validation/migrations/current-state comparison.

### `js/storage.js`

Own:

- raw affected-key snapshots;
- raw writes/removals;
- deterministic write order;
- post-write raw verification;
- full rollback attempt;
- rollback raw verification;
- cache invalidation/synchronization primitives after successful commit.

### `js/restore.js` (new, lazy)

Own only:

- restore-choice model;
- deterministic Legacy merge planning in memory;
- serialization of final candidate values before first write;
- Apply-time fresh Candidate B reanalysis;
- in-flight transaction state;
- structured transaction/recovery result interpretation;
- UI-state data handed to Legacy.

No direct localStorage calls are legal here.

### `js/legacy.js`

Remain the Data Management host. Mount/render the restore controls and destructive/recovery messaging.

### `js/screens.js`

Remain sole route/history authority for post-success application refresh/navigation.

## Transaction contract before implementation

Candidate C application semantics must be all-or-nothing even though Web Storage has no native multi-key transaction.

Required sequence:

1. lock Apply against duplicate activation;
2. flush pending canonical writes;
3. fresh-read/reanalyze selected backup through Candidate B;
4. rerun conflict comparison against current storage;
5. validate that user choices resolve every required conflict;
6. build complete final canonical values in memory;
7. snapshot exact current raw value/absence for every affected canonical key;
8. write all affected keys through storage authority in deterministic order;
9. read every affected key back and compare exact raw committed values/absence;
10. if any write or verification fails, attempt rollback of every affected key, even after an earlier rollback-write failure;
11. read every affected key again and verify exact pre-restore raw bytes/absence;
12. return `rolled-back` only after verified rollback; otherwise return `rollback-failed-critical` and do not navigate;
13. on complete success only, invalidate/reload caches and restore in-memory canonical state;
14. refresh UI and resolve/navigate canonical route through screens authority;
15. release Apply lock.

Candidate final raw strings/absence states must already exist before step 7. No migration, conflict prompt or JSON serialization may be interleaved with canonical writes.

## Legacy merge policy constraints before UI design

Already locked:

- preserve current IDs as strings;
- exact duplicates do not multiply;
- duplicate/conflicting same-ID records inside the backup already block Candidate B and never reach Apply;
- backup-vs-local same-ID different-content conflicts require an explicit user resolution;
- importing the same backup again after successful restore must be idempotent;
- a completed active save already represented in Legacy must not be duplicated accidentally;
- no v1.3 identity redesign.

The precise conflict-choice labels/UI will be implemented only after mapping Candidate B categories to deterministic merge actions. Do not silently choose “newer wins” unless current authority explicitly establishes that policy.

## Test architecture inspected

Current repository already contains:

- `tests/contracts/backup-contracts.cjs`;
- `tests/contracts/import-analysis-contracts.cjs`;
- `tests/contracts/stability-contracts.cjs`;
- real-browser Candidate A and Candidate B audits;
- Stability audits and public deployed smoke.

Candidate B contracts prove:

- analysis source contains no localStorage write/remove authority;
- no network calls;
- migration determinism/idempotence;
- conflict categories;
- checksum/future-format/future-schema failure;
- oversize rejection before `File.text()`;
- hostile-key rejection;
- same-ID conflicting records inside backup block readiness;
- corrupt local bytes remain exactly untouched;
- large 1,500-record analysis remains bounded.

Candidate C must extend this style rather than replace it.

Required dedicated failure injection remains:

- first affected-key failure;
- middle-key failure;
- final-key failure;
- quota/storage exception;
- post-write verification mismatch;
- rollback write failure;
- corrupt pre-existing raw bytes;
- same-ID Legacy conflicts;
- rapid/double Apply;
- stale file/preview/current state;
- repeated import/idempotence;
- lifecycle interruption where reproducible.

## Current stopping point / next action

The historical and roadmap deepening phase is now sufficiently complete to begin Candidate C implementation without another planning loop.

Next action on this branch:

1. add the storage-owned atomic raw transaction primitive and deterministic contract tests first;
2. prove rollback/verification behavior in isolation before adding the restore UI;
3. then add lazy restore orchestration/choice model;
4. then integrate the Data Management UI;
5. then add browser/accessibility/failure evidence;
6. only after diagnostics are clean should version/cache/release identity be frozen for a candidate.

Do not declare Candidate C complete from partial transaction code. This rolling handoff must be updated continuously as implementation advances.
