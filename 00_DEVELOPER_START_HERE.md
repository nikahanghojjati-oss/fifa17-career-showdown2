# Career Mode Showdown — Developer Start Here

Last updated: 2026-08-13
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Purpose: canonical current-facing first read for a new developer session.

## 0. Sixty-second state

Application version: `v1.2.0`
Runtime asset revision: `1.2.0-r1`
Public status: merged, deployed, exact-byte verified and technically production-proven
Immutable runtime merge SHA: `e5acd4ae524f181242df3114b35fd2e812cd8f3b`
Proven GitHub Pages deployment: `5891182853`
Production Stability: `31716787806` / deployed smoke `94503946791`
Release Integration Burn-In: `31716787876` — 2/2

Candidate A export, Candidate B read-only analysis and Candidate C Atomic Restore + Recovery are complete and protected. Candidate C preserves immutable confirmed intent, strict exact raw snapshot/precondition handling, transaction-owned rollback, anti-clobber ownership, post-write verification and byte-for-byte owned rollback verification.

v1.2.0 Installable Offline App is complete technically. It adds a coherent first-party Service Worker shell, atomic cache population, explicit safe-boundary update activation, whole-revision recovery, verified connectivity, offline external-media degradation and install guidance without changing gameplay or canonical data authority.

This technical production proof does not fabricate a separate owner visual-acceptance statement.

`CLOUD_STORAGE_FOUNDATION.md` remains future architecture/security contract only. It does not authorize a cloud backend or network state mutation.

Next legal substantive milestone: v1.3.0 — Recovery & Device Resilience Hardening.

## 1. Read order

1. `00_HANDOFF_GOLDEN_RULE.md`.
2. This file.
3. `00_CURRENT_HANDOFF.md`.
4. `NEXT_TASK.md`.
5. `PROJECT_STATE.md`.
6. `RELEASE_V1.2.0.md`.
7. `CAREER_MODE_SHOWDOWN_V1.2.0_MAINTENANCE_HANDOFF.md`.
8. `POST_V1_ROADMAP_EXECUTION.md`.
9. `CLOUD_STORAGE_FOUNDATION.md` only when future sync/security design is relevant.

Current verified source on `main` wins over stale historical status prose. Never revert proven code merely to satisfy an older document; correct or relabel the document.

## 2. Locked product model

Career Mode Showdown is a two-manager FIFA 17 Career Mode rivalry companion, not a browser football simulator and not yet a cloud/account product.

- exactly two managers;
- one local browser/device and one active Showdown;
- both managers play their own FIFA 17 Career Mode saves outside the site;
- manual FIFA 17 result entry is authoritative;
- same selected league, different permanent clubs;
- Showdown lengths `[1,3,5,10]`;
- default leagues Premier League, LaLiga, Bundesliga, Serie A, Ligue 1;
- Champions League +5, League +3, main domestic Cup +1;
- 100 League Points and/or 100 League Goals share maximum +1;
- Top Scorer and/or Top Assist share maximum +1;
- maximum Season score 11;
- equal non-zero scores are Draw;
- only 0–0 uses league position then league points.

Do not change these rules during v1.3 maintenance hardening.

## 3. Architecture authority

Navigation/history: `js/screens.js`.
Persistence/destructive mutation: `js/storage.js`.
Raw atomic transaction engine: `js/storageTransaction.js` behind storage authority.
Scoring: `js/scoring.js`.
Canonical Showdown model: `js/showdown.js`.
Analytics: `js/analytics.js`.
Service Worker/Cache Storage: application bytes only, never canonical user data.

Canonical localStorage keys remain exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Current Showdown schema: 2.
Current preferences schema: 2.

## 4. Candidate A/B/C safety contract

Candidate A is non-mutating export. SHA-256 is integrity evidence only, never encryption, signing, authentication or authorization.

Candidate B is strictly read-only analysis. Preview is evidence, never write authority.

Candidate C is the only import stage allowed to commit canonical state. A legal Apply must freeze the exact confirmed File/choices and reviewed precondition, freshly revalidate the exact file, capture a strict exact raw snapshot distinguishing absence from read failure, reject stale reviewed state, compute the complete final candidate in memory, enter `js/storage.js` with exact planning bytes, recheck exact bytes immediately before mutation, write deterministic active → Legacy → preferences order, grant mutation ownership only after a successful write, verify every committed byte/value, roll back only transaction-owned mutations in reverse order, refuse to clobber newer/unowned bytes, verify owned rollback byte-for-byte, lock critical recovery if ownership/rollback cannot be proven, synchronize runtime only after verified success, preserve corrupt raw bytes unless explicitly replaced and keep repeated identical restore a zero-write no-op.

Recovery states remain `RESTORE NOT STARTED`, `RESTORE ROLLED BACK`, and `CRITICAL RECOVERY STATE`.

## 5. v1.2.0 production evidence

Runtime merge SHA: `e5acd4ae524f181242df3114b35fd2e812cd8f3b`.
GitHub Pages deployment: `5891182853`.
Pages run: `31716786499`.
Stability run: `31716787806`.
Deployed-site-smoke: `94503946791`.
Release Integration Burn-In: `31716787876`, two complete stateful journey jobs `94503420385` and `94503420339`, both green.

Deployed Stability passed exact runtime bytes, runtime-error provenance, Home/Reus, licensed football visuals, Candidate A, Candidate B, Candidate C, install/offline behavior and the complete public journey.

The frozen release candidate measured 164,563 raw / 37,355 gzip eager code bytes.

v1.1.5 remains historical rollback evidence at `ff755a9863abc843ae9aac45178428e3a104fc65`.

## 6. Smart CI rule — do not recreate the testing loop

There remain 14 permanent workflow families and 27 protected multiline executable blocks.

- specialist workflows own specialist evidence once per attempt;
- Candidate B owns one authoritative import-analysis browser run;
- Candidate C owns one authoritative restore/recovery browser run;
- local Stability owns runtime provenance, offline/cache lifecycle and one complete integration journey;
- deployed Stability owns exact bytes, provenance, Home, visuals, Candidate A/B/C, install/offline and the complete public journey;
- Burn-In is main/manual release-only and repeats the complete stateful journey twice;
- Markdown-only seals skip heavy Candidate B/C/Stability/Burn-In lanes;
- reruns/manual dispatches queue instead of cancelling useful active proofs;
- diagnose product failure separately from browser/test-runtime/infrastructure failure;
- never weaken assertions merely to obtain green CI.

## 7. Performance and presentation locks

Eager raw code ceiling: 165,000 bytes.
Eager gzip ceiling: 37,500 bytes.
Startup Marco Reus portrait ceiling: 95,000 bytes.
Combined first-party startup ceiling: 260,000 bytes.
Normal loading minimum: 2700 ms.
Reduced-motion loading: 220 ms.

Protected Marco Reus Home/loading presentation and accepted licensed route-photo sources remain unchanged.

## 8. Installable Offline App locks

The `1.2.0-r1` shell must remain whole-revision coherent. Failed population must not replace a known-good shell. Install must not silently activate a new worker. Update activation remains user-controlled at a safe application boundary. Candidate C busy/recovery state must block unsafe activation. Cache cleanup is limited to this app's namespaces. Unrelated caches remain untouched. Connectivity is verified through the worker rather than trusted from `navigator.onLine` alone. Offline YouTube/media failure is explicit and nonfatal.

## 9. Future cloud boundary

Cloud remains future-only. Preserve distinct `accountId`, `profileId`, `saveId`, `deviceId`, `installationId`, server-authoritative revisions, `baseRevision` compare-and-swap, explicit conflicts, tombstones/anti-resurrection, local-first privacy, export/delete/retention, TLS/authentication/server authorization, secure tokens, replay/idempotency protection, rate/schema/size limits, no privileged secret in static JS, no future cloud module calling localStorage directly, and the same strict local recovery boundary for downloaded/conflict-resolved state.

## 10. Next milestone and roadmap reconciliation

v1.3.0 — Recovery & Device Resilience Hardening.

Audit browser/device lifecycle, install/update recovery, cache corruption, exact local data preservation, storage read/write/quota failures, Candidate C interruption/ownership uncertainty, runtime/install UI layering, Smart Back, accessibility/responsive/reduced-motion behavior, dependency-lock integrity and release/document coherence. Fix evidence-backed defects only and add focused regression ownership.

The older `POST_V1_ROADMAP_EXECUTION.md` label that assigned v1.3.0 directly to Local Profiles and Save Library is stale as a current-task label after the later v1.2 maintenance decision. Profile/save-library work remains future planned work but must receive an explicitly reconciled version assignment after v1.3 hardening.

A correctly oriented developer should be able to state:

`v1.2.0 / 1.2.0-r1 is merged, deployed and technically production-proven from e5acd4ae524f181242df3114b35fd2e812cd8f3b / Pages 5891182853 / Stability 31716787806 / deployed smoke 94503946791 / Burn-In 31716787876 2-of-2. Candidate A/B/C remain protected. The Installable Offline App is closed technically. Cloud remains future-only. The next legal task is v1.3.0 Recovery & Device Resilience Hardening.`
