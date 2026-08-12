# Career Mode Showdown — Post-v1 Roadmap Execution Guide

Last updated: 2026-08-12
Status: repository-native execution companion to the owner-approved post-v1 roadmap.

## 1. Purpose

This file preserves the approved dependency order and translates it into implementation-oriented milestones against current source. It is not a new roadmap and does not reopen settled product rules.

Current source remains implementation authority. `PROJECT_STATE.md` and `NEXT_TASK.md` define current release/task status.

## 2. Current starting point

Current application: `v1.1.5`
Current runtime revision: `1.1.5-r1`
Immutable application runtime authority: `ff755a9863abc843ae9aac45178428e3a104fc65`
Public status: deployed and independently production-proven twice
Current CI/docs main head: `0af73262fcc95fbd76ffe9a2f06d4b0dac911f62` — workflow/test maintenance only; application runtime unchanged

Current product model remains:

- exactly two managers;
- one browser/device;
- one active local Showdown;
- manual FIFA 17 result entry;
- localStorage persistence;
- GitHub Pages deployment;
- static SPA using HTML/CSS/vanilla JavaScript.

Candidate A export, Candidate B read-only analysis, and Candidate C atomic restore/recovery are complete and protected. v1.1.5 permanently adds immutable confirmed restore intent, strict exact raw snapshot/precondition handling, complete in-memory planning, post-write verification, and transaction-owned rollback with byte-for-byte owned rollback verification.

`CLOUD_STORAGE_FOUNDATION.md` records future identity, revision, conflict, tombstone, privacy, and security requirements without adding cloud runtime.

v1.2.0 Installable Offline App is now the current substantive roadmap milestone. Stable local profiles/save identity and later cloud readiness remain dependency-ordered after it.

## 3. Permanent rules every roadmap milestone inherits

### Gameplay integrity

- maximum Season score remains 11;
- performance pair bonus remains maximum +1;
- Top Scorer/Top Assist pair remains maximum +1;
- only 0–0 uses league position then league points;
- equal non-zero scores remain Draw;
- managers use same selected league and different permanent clubs;
- club pair is chosen/saved once, no reroll;
- default Wheel remains the accepted top five FIFA 17-era leagues;
- Transfer phase locks/rollback remain authoritative;
- Season Review remains nonpersistent until confirmation.

### Architecture integrity

- `js/screens.js` remains sole navigation/history authority;
- `js/storage.js` remains sole persistence/destructive mutation authority;
- `js/storageTransaction.js` remains raw transaction engine behind storage authority;
- `js/analytics.js` remains sole analytics calculation authority;
- critical transitions save first and rollback/block on failure;
- draft writes remain debounced/deduplicated;
- optional/gameplay modules remain lazy unless measurement proves otherwise;
- every changed runtime byte receives a new cache identity;
- no framework rewrite merely for modernization.

### Data-safety integrity

- Candidate A export stays non-mutating;
- Candidate B analysis stays read-only;
- Candidate C keeps strict exact raw snapshot authority, immutable confirmed intent, stale-state barriers, complete in-memory planning, deterministic write order, post-write verification, transaction-owned reverse rollback, anti-clobber ownership checks, byte-for-byte rollback verification, corrupt-byte preservation, and zero-write deterministic repeat import;
- future service-worker/cache layers may never silently weaken local recovery;
- future cloud/downloaded state must re-enter the same canonical local storage boundary.

### Presentation/rights integrity

- FIFA 17-inspired language remains original and rights-safe;
- no copied EA/FIFA UI artwork, proprietary font, copied menu audio, or official club crests by default;
- local/appropriately licensed photography keeps provenance;
- mobile and Chromebook remain first-class;
- reduced motion remains first-class.

### Validation integrity

- each specialist workflow owns specialist evidence once per workflow attempt;
- local Stability owns canonical runtime provenance + one complete integration journey;
- deployed Stability remains exhaustive across exact bytes, Home/visuals, Candidate A/B/C, and full journey;
- Release Integration Burn-In repeats only the complete stateful integration journey twice on main/manual release use;
- documentation-only seals must not launch heavy Candidate B/C/Stability/Burn-In lanes;
- reruns/manual dispatches must not cancel active proofs;
- do not poll long jobs every few seconds or rerun complete matrices to repeat one owner proof.

## 4. Dependency chain

`v1.0.x Stability Lane`
→ `v1.1.x Data Safety and Recovery`
→ `v1.2.0 Installable Offline App`
→ `v1.3.0 Local Profiles and Save Library`
→ `v1.4.0 Legacy 2.0 and Achievements`
→ `v1.5.0 Analytics 2.0`
→ `v1.6.0 Optional Content Packs`
→ `v1.7.0 Challenge Studio`
→ `v1.8.0 Cloud Readiness`
→ `v1.9.0 Cloud Backup Beta`
→ `v2.0.0 Private QR Paired Two-Device Alpha`
→ `v2.1.0 Connected Rivalry`
→ `v2.2.0 Private Sharing and Groups`
→ `v3.0 community/rankings decision gate`

Most important ordering rule:

Cloud and two-device work cannot begin on the present singleton localStorage model. Recovery, migrations, stable identities, save registry, and cloud-safe persistence boundary must exist first.

## 5. Release-train matrix

| Version | Outcome | Depends on | Explicitly does not include |
| --- | --- | --- | --- |
| v1.1.x | validated export/analysis/atomic recovery | stable local schemas | profiles, PWA, cloud |
| v1.2.0 | installable/offline shell | recovery foundation | profiles/cloud |
| v1.3.0 | stable local identities + multi-save registry | migrations/export | accounts/cloud |
| v1.4.0 | richer rivalry history + achievements | stable identities | scoring changes |
| v1.5.0 | deeper accessible analytics | identity/history model | global leaderboards |
| v1.6.0 | opt-in content packs | backup + registry | default Wheel replacement |
| v1.7.0 | optional challenge studio | pack/version rules | canonical score changes |
| v1.8.0 | async repository/cloud-ready data model | stable local model | cloud UI/network dependency |
| v1.9.0 | opt-in cloud backup | provider/budget/privacy decision | realtime play |
| v2.0.0 | private QR two-device alpha | remote reliability/security | matchmaking/public rooms |
| v2.1.0 | full connected rivalry | paired alpha | public social network |
| v2.2.0 | private sharing/groups | identity/privacy/backend | public feed/comments |
| v3.0 gate | decide community/rankings | proven demand/integrity/budget | automatic commitment |

## 6. Stability and v1.1 exit state

The original v1.0.x Stability Lane is closed. Its deterministic contracts, browser journeys, corrupt-storage/quota/reload/navigation coverage, exact deployed-byte checks, and protected Home/Reus/football-visual gates remain permanent regression infrastructure.

The old r5 James/Rashford/Martial acceptance condition is historical and has been superseded by the accepted v1.1.3 route-scoped visual archive. Do not reopen that visual selection work without new owner evidence.

v1.1 Data Safety and Recovery is also functionally complete through Candidate A export, Candidate B read-only analysis, and Candidate C atomic restore/recovery. v1.1.5 maintenance is merged, deployed, and twice-proven. Candidate A/B/C are now complete; it is not the current task list.

The old release-validation topology that repeated specialist browser suites inside Stability and five full Burn-In matrices is also historical. It was replaced after v1.1.5 by single-owner evidence, canonical Stability, two focused Burn-In journeys, rerun-safe concurrency, and Markdown-only heavy-lane skips.

v1.2.0 Installable Offline App is the current substantive roadmap milestone.

## 7. v1.1.x — Data Safety and Recovery historical contract

This section is implementation history/architecture guidance, not current work.

Candidate A established deterministic non-mutating export and corruption evidence.
Candidate B established strict read-only analysis/migration/conflict preview.
Candidate C established explicit atomic restore/recovery under canonical storage authority.
v1.1.5 then strengthened Candidate C with immutable confirmed intent and transaction-owned rollback.

Current canonical localStorage keys remain exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Current Showdown schema: 2.
Current preferences schema: 2.

Do not introduce a new persistence authority while implementing v1.2.

## 8. v1.2.0 — Installable Offline App

### Goal

Make the core local tracker installable and bootable without network access while preserving the exact v1.1.5 runtime-revision and data-recovery guarantees.

### Depends on

- Candidate A/B/C recovery foundation;
- v1.1.5 strict storage transaction semantics;
- current release/cache identity discipline;
- current startup budgets and responsive/reduced-motion paths.

### Required deliverables

1. web app manifest;
2. original install icons/theme metadata;
3. service worker for versioned first-party shell;
4. atomic cache activation;
5. explicit cache-version ownership tied to runtime revision;
6. visible Update Ready flow;
7. offline status;
8. graceful external-media unavailable state;
9. Chromebook/Android install behavior;
10. browser-appropriate install guidance elsewhere;
11. first-load/repeat-load/offline tests;
12. update/activation tests;
13. rollback/cache-corruption tests;
14. two consecutive cache-revision upgrade/rollback proofs before release.

### Core service-worker safety rule

A stale service worker must never mix incompatible HTML/CSS/JS revisions.

Activation must be atomic from the application's point of view. If the new cache cannot be completely prepared and verified, the old known-good runtime remains authoritative.

Never let a partially populated new cache become active.

### Recommended cache ownership model

Use a cache namespace that contains a semantic app/cache revision, for example conceptually:

`career-mode-showdown-shell-<runtimeRevision>`

The exact string is implementation detail, but it must derive from a release/cache authority and cannot be a mutable timestamp-only identifier.

The service worker should distinguish:

- versioned first-party shell assets;
- optional route assets;
- external media/network resources;
- user data, which must not be moved into Cache Storage as a substitute for canonical persistence.

### Install phase

The install event may prepare the complete new first-party shell, but installation alone must not delete the current good cache.

If required shell acquisition fails:

- fail the new install;
- keep the active service worker/cache unchanged;
- preserve all localStorage data;
- do not redirect or reset the user.

### Activate phase

Activation may remove obsolete application shell caches only after the new shell is complete and the worker is becoming authoritative.

Do not delete unrelated origin caches.

### Update Ready UX

An updated service worker should not silently replace a live runtime mid-transaction.

Preferred direction:

- detect waiting worker;
- surface Update Ready;
- allow user-controlled refresh/reload at a safe boundary;
- do not interrupt Candidate C Apply, Season confirmation, Transfer confirmation, destructive Data Management action, or another persistence-critical transition.

### Offline behavior

Core local tracker functionality should remain available offline once installed/cached.

External YouTube/media or remote licensed sources that cannot legally/reliably be cached should degrade visibly without breaking the core tracker.

Do not imply external media is available offline unless it actually is.

### Data safety across update

Service-worker operations must not mutate the three canonical localStorage keys.

An application update must preserve:

- active Showdown raw bytes;
- Legacy raw bytes;
- preferences raw bytes;
- schema migration authority;
- Candidate A export compatibility;
- Candidate B read-only analysis;
- Candidate C exact rollback/recovery semantics.

If a future runtime requires a data-schema migration, that migration must use the existing explicit migration/recovery discipline; the service worker itself must not perform ad hoc localStorage migration.

### v1.2 test matrix

At minimum prove:

1. first online install;
2. repeat online load;
3. installed offline boot;
4. navigation through core local routes offline;
5. unavailable external media degrades safely;
6. update discovers new worker/cache;
7. active old runtime continues until safe update action;
8. update activation serves one coherent revision only;
9. failed new-cache population leaves old runtime usable;
10. simulated cache corruption does not destroy local data;
11. rollback to prior known-good shell works when required;
12. service-worker restart/reload remains deterministic;
13. reduced-motion behavior remains correct;
14. mobile/Chromebook installation paths remain usable;
15. Candidate A/B/C behavior is unchanged before/after update;
16. two consecutive upgrade/rollback cycles pass on release candidate and production.

### Explicit v1.2 exclusions

Do not add:

- accounts;
- cloud sync;
- cloud backup;
- remote profiles;
- multi-save registry redesign;
- QR pairing;
- two-device state transport;
- gameplay/scoring changes;
- framework rewrite.

## 9. v1.3.0 — Local Profiles and Save Library

### Goal

Introduce stable local profile/save identity and a multi-save registry after offline/update safety is proven.

### Why after v1.2

Profiles/save-library migration changes the persistence model. It should happen only after users already have reliable export/recovery and the installed shell can update safely.

### Required direction

- stable profile identity;
- stable save identity independent of display names;
- multi-save registry;
- migration from the singleton active-save model;
- explicit active-save selection;
- Candidate A/B/C compatibility with registry-backed saves;
- rollback-safe migration fixtures.

Cloud remains excluded.

## 10. v1.4.0 — Legacy 2.0 and Achievements

Build richer rivalry history and achievements on stable local identities. Do not change canonical scoring. Historical records must remain attributable after profile/save migration.

## 11. v1.5.0 — Analytics 2.0

Expand accessible analytics on stable identity/history. `js/analytics.js` remains calculation authority. Do not introduce public/global leaderboards.

## 12. v1.6.0 — Optional Content Packs

Add opt-in content/league/challenge packs under explicit version/provenance rules. Do not replace the accepted default Wheel or silently change canonical rules.

## 13. v1.7.0 — Challenge Studio

Allow optional user-defined challenge content without changing canonical scoring authority. Export/import/versioning rules must be explicit.

## 14. v1.8.0 — Cloud Readiness

### Goal

Prepare an asynchronous repository/persistence model that can support remote state later without adding a cloud UI/network dependency yet.

### Depends on

- v1.2 installed/update-safe runtime;
- v1.3 stable profile/save identity;
- mature export/import/migration fixtures;
- `CLOUD_STORAGE_FOUNDATION.md` identity/revision/conflict/tombstone/security contract.

### Key rule

No future cloud module may call localStorage directly. Introduce an explicit persistence/repository boundary while preserving current local behavior.

## 15. v1.9.0 — Cloud Backup Beta

Cloud backup is opt-in. It requires provider/budget/privacy decisions, authenticated ownership, server-side authorization, TLS, secure sessions/tokens, compare-and-swap revisions, explicit conflict handling, tombstones, deletion/export/retention controls, rate/schema/size limits, and idempotency/replay protection.

Downloaded state must still pass local Candidate C-style validation and storage authority.

Do not use silent last-write-wins for gameplay state.

## 16. v2.0.0 — Private QR Paired Two-Device Alpha

Only after remote persistence/security is reliable. Private pairing is not public matchmaking. Pairing identity, session authorization, replay protection, disconnect/reconnect, stale revision conflicts, and recovery must be explicit.

## 17. v2.1.0 — Connected Rivalry

Expand the private paired alpha after reliability/security proof. Do not automatically turn the product into a public social network.

## 18. v2.2.0 — Private Sharing and Groups

Requires mature identity/privacy/backend controls. Private groups/sharing remain distinct from a public feed/comments system.

## 19. v3.0 decision gate

Community/rankings are a decision gate, not an automatic commitment. Proceed only with proven demand, integrity controls, moderation/privacy plan, and sustainable backend budget.

## 20. Current execution rule

The next developer must not return to v1.1 Candidate planning. Begin v1.2 by studying current cache/version/startup/data-safety authority, then implement the smallest coherent install/offline slice while continuously recording work under `00_HANDOFF_GOLDEN_RULE.md`.

Do not recreate the old testing loop. Use owner workflows, let long jobs run without rapid polling, and repeat only the canonical proof that a release requirement actually needs.