# Career Mode Showdown — Post-v1 Roadmap Execution Guide

Last updated: 2026-08-13 ET
Status: current execution companion to the owner-approved post-v1 direction.

## 1. Current authority

Current production application: v1.2.0 — Installable Offline App
Current runtime revision: `1.2.0-r2`
Previous known-good runtime: `1.2.0-r1`
Release PR: #39
Hotfix merge: `2179b7928602b9579dc6e129c40b8739082de80a`
Technical production proof: Stability `31740111919` / deployed-site-smoke `94581704562`; Burn-In `31740111986` 2/2
Current continuation authority: `00_CURRENT_HANDOFF.md`, `PROJECT_STATE.md`, `NEXT_TASK.md`

This file preserves dependency order and implementation intent. It cannot override current verified source, later explicit owner decisions or the current authority documents above.

v1.1 Data Safety and Recovery is complete. Candidate A/B/C are protected systems, not the current feature task.

v1.2.0 / `1.2.0-r2` is the current production baseline. r2 corrected iOS standalone loading composition and moved install/update presentation into Settings only. `1.2.0-r1` remains immutable previous-known-good rollback evidence.

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
- `js/storageTransaction.js` remains the raw transaction engine behind storage authority;
- `js/analytics.js` remains sole analytics calculation authority;
- critical transitions save first and rollback/block on failure;
- optional/gameplay modules remain lazy unless measurement proves otherwise;
- every changed runtime byte receives a coherent cache identity;
- no framework rewrite merely for modernization.

### Data-safety integrity

- exactly three canonical localStorage keys remain legal;
- Candidate A export stays non-mutating;
- Candidate B analysis stays read-only;
- Candidate C preserves immutable confirmed intent, strict exact raw snapshot/preconditions, stale-state barriers, complete in-memory planning, last-moment prewrite checks, deterministic write ownership, post-write verification, transaction-owned reverse rollback, anti-clobber checks, byte-for-byte rollback verification, corrupt-byte preservation and deterministic zero-write re-import;
- Service Worker/Cache Storage may never become canonical user-data authority;
- future downloaded/cloud state must re-enter the same canonical local storage boundary.

### Presentation and product-integration integrity

- FIFA 17-inspired presentation remains original and rights-safe;
- accepted Home/loading and route-scoped football-photo intent remains protected except for evidence-backed defect fixes;
- mobile, Chromebook and reduced motion remain first-class;
- install/update presentation remains Settings-owned;
- persistent floating/sticky global overlays are exceptional product decisions and require explicit owner authorization;
- visual validation must judge composition relationships and screenshots, not element existence or decode success alone.

### Validation integrity

There remain 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs exercise 13 families; Burn-In is main/manual release-only.

- specialists own specialist evidence once;
- Candidate B owns one import-analysis browser proof;
- Candidate C owns one restore/recovery browser proof;
- local Stability owns runtime provenance, offline/cache lifecycle and one complete integration journey;
- deployed Stability owns exact bytes, provenance, Home, visuals, Candidate A/B/C, Settings/offline behavior and the complete public journey;
- Release Integration Burn-In repeats the complete stateful journey twice;
- never duplicate evidence or weaken a gate just to obtain green CI.

## 3. Completed dependency chain

`v1.0.x Stability Lane`
→ `v1.1.x Data Safety and Recovery`
→ `v1.2.0 Installable Offline App`
→ `v1.2.0-r2 production maintenance hotfix`

These are technically closed at the current production baseline.

The older roadmap text that assigned v1.3.0 directly to Local Profiles and Save Library is stale as current-task authority. The later owner/current-facing decision reserves v1.3.0 for Recovery & Device Resilience Hardening before changing the persistence model.

Local Profiles/Save Library remains future approved direction but has no current version assignment. Do not silently renumber it during v1.3 hardening.

## 4. Current milestone — v1.3.0 Recovery & Device Resilience Hardening

### Goal

Reduce risk after the PWA transition and close evidence-backed resilience defects without adding new product scope.

Start from current verified `main` / `1.2.0-r2`.

### Critical PR #37 warning

Open draft PR #37 (`agent/v13-hardening`) is not a safe baseline. Last inspected head: `221212a87cc58712a1ebd9452d7b71cdaa36327d`.

Commit `6ce7fe6fab87031b69e3dc5e98587fd3f78b3558` (`Freeze v1.3 shell identity`) replaced large portions of the proven production DOM while existing JS/CSS still depended on the original structure. It caused menu initialization/visibility failures and version-coherence problems.

Before using any PR #37 work:

1. fetch current `main` and PR #37;
2. compare PR #37 against current r2 main, not its historical base;
3. classify changed files and isolate useful evidence-backed hardening;
4. remove/reconcile the accidental shell replacement rather than migrating the whole app to it;
5. revalidate useful changes against current source and protected tests;
6. do not merge/deploy until coherent release identity and all required gates are green.

Known potentially useful PR #37 hardening ideas include blocked-read fail-closed Candidate A behavior, preservation/restoration of true pre-offline media state, update activation race hardening, Service Worker registration reuse and semantic roadmap/dependency contracts. These are ideas to re-audit, not pre-approved merge content.

### Required audit areas

1. browser close/reopen, reload, controller change and update-interruption behavior;
2. failed Service Worker population and activation recovery;
3. current/previous cache corruption and deterministic whole-shell selection;
4. exact preservation of all three canonical raw localStorage values across lifecycle failures;
5. quota, blocked read/write and corrupt raw storage behavior;
6. Candidate C interruption, ownership uncertainty, rollback verification and stale-state handling;
7. Settings/offline/update UI layering, focus and pointer safety;
8. Smart Back and lazy-screen/listener ownership;
9. Chromebook low-height, mobile, DPR2, touch, keyboard, reduced-motion and accessibility coverage;
10. external-media offline/online transitions;
11. dependency-lock integrity and reproducible `npm ci`;
12. workflow ownership/cancellation/artifact failure semantics;
13. release/version/revision and handoff coherence;
14. performance headroom without increasing protected ceilings.

Fix only evidence-backed defects. Add focused regression ownership for every real fix. Preserve working gameplay, data safety, navigation, PWA behavior, performance and accepted visuals.

### Exclusions

Do not add profiles, accounts, cloud sync, cloud backup, QR pairing, two-device transport, gameplay/scoring changes or a framework rewrite during v1.3 hardening.

## 5. Local Profiles and Save Library — future feature milestone, version pending

The feature remains approved in dependency order but does not own the v1.3.0 label.

Required direction remains:

- stable profile identity;
- stable save identity independent of display names;
- multi-save registry;
- migration from the singleton active-save model;
- explicit active-save selection;
- Candidate A/B/C compatibility with registry-backed saves;
- rollback-safe migration fixtures;
- cloud excluded.

Assign its version explicitly only after v1.3 hardening is closed.

## 6. Later approved direction

After stable local identity exists, planned outcomes remain dependency-ordered:

- Legacy/Achievements expansion without canonical scoring changes;
- deeper accessible analytics with `js/analytics.js` remaining calculation authority;
- optional content/league/challenge packs without replacing the accepted default Wheel;
- user-defined challenge content without changing canonical scoring authority;
- Cloud Readiness architecture with no cloud UI/network dependency initially;
- authenticated opt-in Cloud Backup only after local identity/recovery is proven;
- private QR paired two-device use only after remote persistence/security is reliable;
- later private sharing/groups and any community/rankings only after explicit reliability, integrity, moderation, privacy and cost gates.

Historical numeric labels for these later outcomes are planning references and must be revalidated after v1.3.

## 7. Cloud foundation boundary

`CLOUD_STORAGE_FOUNDATION.md` remains future architecture contract only.

Before cloud runtime exists preserve distinct account/profile/save/device/installation identity, server-authoritative revision tokens and `baseRevision`, compare-and-swap, explicit conflicts, tombstones/anti-resurrection, local-first privacy, export/delete/retention, TLS/authentication/server authorization, least privilege, secure token handling, replay/idempotency protection, rate/schema/size limits, no privileged secret in static JS and no future cloud module calling localStorage directly.

Downloaded state must still pass Candidate C-style local validation and canonical storage authority.

## 8. Current execution rule

Begin v1.3 from proven v1.2.0 / `1.2.0-r2` production. Audit before changing code. Separate product defects from test/runtime/infrastructure defects. Preserve functions and accepted visuals. Add focused regression proof for each real defect fixed. Keep continuous handoff evidence under `00_HANDOFF_GOLDEN_RULE.md`.