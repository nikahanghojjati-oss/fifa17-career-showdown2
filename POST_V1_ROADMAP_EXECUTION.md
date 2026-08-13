# Career Mode Showdown — Post-v1 Roadmap Execution Guide

Last updated: 2026-08-13
Status: repository-native execution companion to the owner-approved post-v1 direction.

## 1. Purpose and authority

This file preserves dependency order and implementation intent. It is not allowed to override current verified source, later explicit owner decisions, `PROJECT_STATE.md` or `NEXT_TASK.md`.

Current production application: v1.2.0 — Installable Offline App
Current runtime revision: `1.2.0-r1`
Immutable runtime merge SHA: `e5acd4ae524f181242df3114b35fd2e812cd8f3b`
Proven GitHub Pages deployment: `5891182853`
Technical production proof: Stability `31716787806` / deployed smoke `94503946791`; Burn-In `31716787876` 2/2

v1.1 Data Safety and Recovery is also functionally complete. Candidate A/B/C are now complete; it is not the current task list.

The old r5 James/Rashford/Martial acceptance condition is historical and was superseded by the later accepted route-scoped visual archive. Do not reopen historical visual selection without new owner evidence.

## 2. Permanent rules every roadmap milestone inherits

### Gameplay integrity

- exactly two managers;
- maximum Season score 11;
- performance pair bonus maximum +1;
- Top Scorer/Top Assist pair maximum +1;
- only 0–0 uses league position then league points;
- equal non-zero scores remain Draw;
- same selected league and different permanent clubs;
- club pair is chosen/saved once, no reroll;
- default Wheel remains the accepted five FIFA 17-era leagues;
- Transfer phase locks/rollback remain authoritative;
- Season Review remains nonpersistent until confirmation.

### Architecture integrity

- `js/screens.js` remains sole navigation/history authority;
- `js/storage.js` remains sole persistence/destructive mutation authority;
- `js/storageTransaction.js` remains raw transaction engine behind storage authority;
- `js/analytics.js` remains sole analytics calculation authority;
- critical transitions save first and rollback/block on failure;
- optional/gameplay modules remain lazy unless measurement proves otherwise;
- every changed runtime byte receives a coherent cache identity;
- no framework rewrite merely for modernization.

### Data-safety integrity

- exactly three canonical localStorage keys remain legal;
- Candidate A export stays non-mutating;
- Candidate B analysis stays read-only;
- Candidate C preserves immutable confirmed intent, strict exact raw snapshot authority, stale-state barriers, complete in-memory planning, last-moment prewrite checks, deterministic write order, post-write verification, transaction-owned reverse rollback, anti-clobber ownership checks, byte-for-byte rollback verification, corrupt-byte preservation and deterministic zero-write re-import;
- Service Worker/Cache Storage layers may never become canonical user-data authority;
- future downloaded/cloud state must re-enter the same canonical local storage boundary.

### Presentation and rights integrity

- FIFA 17-inspired presentation remains original and rights-safe;
- do not bundle proprietary EA/FIFA artwork, fonts or menu audio without rights;
- local/appropriately licensed football photography keeps provenance;
- protected Marco Reus Home/loading presentation remains intact unless new owner evidence requires a defect fix;
- mobile, Chromebook and reduced motion remain first-class.

### Validation integrity

There remain 14 permanent workflow families and 27 protected multiline executable blocks.

- specialists own specialist evidence once;
- Candidate B owns one import-analysis browser proof;
- Candidate C owns one restore/recovery browser proof;
- local Stability owns runtime provenance, offline/cache lifecycle and one complete integration journey;
- deployed Stability owns exact bytes, provenance, Home, visuals, Candidate A/B/C, install/offline and the complete public journey;
- Release Integration Burn-In repeats only the complete stateful journey twice on main/manual release use;
- Markdown-only seals skip heavy browser lanes;
- reruns/manual dispatches do not cancel useful active proof;
- never duplicate evidence or weaken a gate just to obtain green CI.

## 3. Completed dependency chain

`v1.0.x Stability Lane`
→ `v1.1.x Data Safety and Recovery`
→ `v1.2.0 Installable Offline App`

All three are technically closed at the current production baseline.

## 4. v1.2.0 — Installable Offline App — completed

v1.2.0 / `1.2.0-r1` made the core local tracker installable and bootable without network access while preserving data-recovery and whole-runtime revision guarantees.

Completed deliverables include:

1. Web App Manifest;
2. original install icons/theme metadata;
3. version-owned first-party Service Worker shell;
4. atomic cache population and verification;
5. no automatic install-time activation;
6. visible Update Ready flow;
7. safe-boundary activation blocked by critical transaction/recovery state;
8. whole-runtime cache selection and previous-known-good recovery;
9. verified offline status through a worker-owned network probe;
10. graceful external-media unavailable state;
11. Chromebook/Android install behavior and browser guidance;
12. exact three-key local data preservation;
13. failed-population and corruption recovery;
14. unrelated-cache preservation;
15. two consecutive revision upgrade/recovery cycles.

Production evidence is recorded in `RELEASE_V1.2.0.md`.

## 5. Current milestone — v1.3.0 Recovery & Device Resilience Hardening

### Why this supersedes the older v1.3 label

The earlier version of this execution guide assigned v1.3.0 directly to Local Profiles and Save Library. During v1.2 release maintenance, a later current-facing decision reserved v1.3.0 for Recovery & Device Resilience Hardening before changing the persistence model. Under project authority rules, the later `PROJECT_STATE.md`, `NEXT_TASK.md` and v1.2 maintenance handoff win.

Therefore the old v1.3 Local Profiles label is stale current-task information. This correction does not cancel Local Profiles; it prevents a future developer from changing the persistence model before the new installed/offline lifecycle receives a dedicated maintenance pass.

### Goal

Reduce risk after the PWA transition and close evidence-backed resilience defects without adding new product scope.

### Required audit areas

1. browser close/reopen, reload, controller change and update-interruption behavior;
2. failed Service Worker population and activation recovery;
3. current/previous cache corruption and deterministic whole-shell selection;
4. exact preservation of all three canonical raw localStorage values across lifecycle failures;
5. quota, blocked read/write and corrupt raw storage behavior;
6. Candidate C interruption, ownership uncertainty, rollback verification and stale-state handling;
7. runtime-notice/install/offline UI layering, focus and pointer safety;
8. Smart Back and lazy-screen listener ownership;
9. Chromebook low-height, mobile, DPR2, touch, keyboard, reduced-motion and axe coverage;
10. external-media offline/online transitions;
11. dependency-lock integrity and reproducible `npm ci`;
12. workflow ownership/cancellation/artifact failure semantics;
13. release/version/revision and handoff coherence;
14. performance headroom without increasing protected ceilings.

### Exclusions

Do not add profiles, accounts, cloud sync, cloud backup, QR pairing, two-device transport, gameplay/scoring changes or a framework rewrite during v1.3 hardening.

## 6. Local Profiles and Save Library — future feature milestone, version assignment pending

The feature remains approved in dependency order but no longer owns the v1.3.0 label.

Required direction remains:

- stable profile identity;
- stable save identity independent of display names;
- multi-save registry;
- migration from the singleton active-save model;
- explicit active-save selection;
- Candidate A/B/C compatibility with registry-backed saves;
- rollback-safe migration fixtures;
- cloud excluded.

Do not silently renumber this feature or later releases in this maintenance seal. Assign its version explicitly after v1.3 hardening is closed.

## 7. Later approved direction

The following product outcomes remain dependency-ordered after stable local identity exists. Their historical numeric labels are planning references and must be revalidated when Local Profiles receives its new explicit version assignment.

- Legacy 2.0 and Achievements: richer rivalry history/achievements without canonical scoring changes.
- Analytics 2.0: deeper accessible analytics with `js/analytics.js` remaining calculation authority; no public global leaderboard.
- Optional Content Packs: opt-in content/league/challenge packs with explicit version/provenance rules; do not replace the accepted default Wheel.
- Challenge Studio: optional user-defined challenge content without changing canonical scoring authority.
- Cloud Readiness: asynchronous repository/persistence boundary with no cloud UI/network dependency yet.
- Cloud Backup Beta: opt-in authenticated remote backup with privacy, revisions, compare-and-swap, explicit conflicts, tombstones, deletion/export/retention, rate/schema/size limits and replay/idempotency protection.
- Private QR Paired Two-Device Alpha: only after remote persistence/security is reliable; private pairing is not public matchmaking.
- Connected Rivalry: expand private paired use only after reliability/security proof.
- Private Sharing and Groups: requires mature identity/privacy/backend controls.
- Community/rankings: a decision gate only, contingent on demand, integrity, moderation/privacy and sustainable backend cost.

## 8. Cloud foundation boundary

`CLOUD_STORAGE_FOUNDATION.md` remains future architecture contract only.

Before cloud runtime exists preserve distinct `accountId`, `profileId`, `saveId`, `deviceId`, `installationId`, server-authoritative revision tokens and `baseRevision`, compare-and-swap, explicit conflicts, tombstones/anti-resurrection, local-first privacy, export/delete/retention, TLS/authentication/server authorization, least privilege, secure token handling, replay/idempotency protection, rate/schema/size limits, no privileged secret in static JS and no future cloud module calling localStorage directly.

Downloaded state must still pass Candidate C-style local validation and canonical storage authority.

## 9. Current execution rule

Begin v1.3 from the proven v1.2.0 / `1.2.0-r1` production baseline. Audit before changing code. Separate product defects from test/runtime infrastructure defects. Preserve functions and accepted visuals. Add focused regression proof for every real defect fixed. Keep continuous handoff evidence under `00_HANDOFF_GOLDEN_RULE.md`.
