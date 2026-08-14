# Career Mode Showdown — Developer Start Here

Last updated: 2026-08-13 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Purpose: canonical first read for a new developer session.

## Sixty-second state

Production application: `v1.3.0` — Recovery & Device Resilience Hardening
Production runtime: `1.3.0-r1`
Previous known-good runtime: `1.2.0-r2`
Runtime release PR: #42
Runtime merge: `094401b649954656e27e4a92d027e9532e84ccbf`
Production proof: `V1.3.0_PRODUCTION_PROOF.md`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

The owner has now explicitly authorized the next dependency-ordered product direction: Local Profiles / Save Library. Its release version remains intentionally unassigned.

The first bounded foundation candidate merged through PR #46 at `b76baf3be8107a57c5898f691d5178ae1d8a8547`. It adds pure identity/migration planning in `js/saveLibraryFoundation.js` and focused contracts, but the module is not loaded by the production application and performs no runtime storage writes. Production remains `v1.3.0` / `1.3.0-r1`.

Technical production proof and owner visual/product acceptance remain separate evidence channels.

## Required read order

1. `00_HANDOFF_GOLDEN_RULE.md`
2. this file
3. `00_CURRENT_HANDOFF.md`
4. `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`
5. `PROJECT_STATE.md`
6. `NEXT_TASK.md`
7. `V1.3.0_PRODUCTION_PROOF.md`
8. `RELEASE_V1.3.0.md`
9. `CAREER_MODE_SHOWDOWN_V1.3.0_MAINTENANCE_HANDOFF.md`
10. `POST_V1_ROADMAP_EXECUTION.md`
11. `00_MASTER_DEVELOPER_CONTEXT.md` only when deeper history is needed.

Verify current `main` at session start. Source and later explicit owner decisions outrank stale historical prose.

## Locked product model

Exactly two managers; Showdown lengths 1/3/5/10; same selected league; different permanent clubs; existing scoring; 11-point maximum; equal non-zero scores are Draw; only 0–0 uses league position then league points.

League confirmation, Club confirmation, Transfer Challenge, Season Entry, Season Review, Statistics, Legacy, Trophy Room, Rule Book, Settings, Home/Continue Career, Create Showdown and Smart Back remain protected.

## Architecture authority

Navigation/history/Smart Back: `js/screens.js`.
Persistence/destructive mutation: `js/storage.js`.
Raw transaction engine: `js/storageTransaction.js`.
Scoring: `js/scoring.js`.
Analytics: `js/analytics.js`.
Service Worker/Cache Storage: application bytes only, never canonical user data.

The currently canonical localStorage keys remain exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`careerModeShowdown.saveLibrary` exists only as a proposed future key in the merged planning foundation. It is not yet canonical and no runtime code writes it.

## Recovery contract

Candidate A remains non-mutating export. Candidate B remains strictly read-only analysis. Candidate C is the only import stage allowed to commit canonical state. A legal Apply preserves immutable confirmed intent, strict exact raw snapshot/preconditions, stale-state barriers, complete in-memory planning, last-moment exact-byte checks, transaction-owned mutation and rollback, anti-clobber ownership, post-write verification, byte-for-byte rollback verification, corrupt-byte preservation and critical recovery on uncertainty.

The next persistence candidate may not weaken these guarantees merely to accommodate a new registry slot.

## Installable Offline App locks

Current shell: `1.3.0-r1`. Immediate previous known-good shell: `1.2.0-r2`.

Preserve atomic verified cache population, explicit safe update activation, Candidate C activation gating, whole-runtime selection, corruption-aware current/previous recovery, app-namespace-only cleanup, worker-owned connectivity probing, nonfatal external-media degradation and lazy PWA loading.

`CMS_ACTIVATE_UPDATE` must verify the whole shell and await successful `skipWaiting()` before acknowledging acceptance.

Install/update presentation remains Settings-only.

## Visual locks

Preserve the r2 iOS installed-app loading composition: bounded mobile top band, independent subject-safe Reus image box, width-owned composition and opacity/filter-only animation. Do not use viewport-height-sensitive sizing or arbitrary crop/brightness hacks.

## Validation and performance

There are 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs run 13; Burn-In runs on `main`/manual release authority.

Protected ceilings: eager raw <=165,000; eager gzip <=37,500; Reus portrait <=95,000; combined startup <=260,000 bytes; normal loading minimum 2700 ms; reduced-motion loading 220 ms.

PR #46 preserved eager startup at 164,563 raw / 37,355 gzip because the foundation module remains unloaded.

## Current continuation

`v1.3.0 — Recovery & Device Resilience Hardening` remains the production milestone and runtime authority.

Local Profiles / Save Library is now the explicitly authorized active development direction, version pending. The identity/migration planning foundation is merged and publicly validated. The next legal engineering candidate is canonical persistence integration only: prove the atomic transition from the current singleton active slot toward the Save Library without temporarily creating two canonical authorities or weakening Candidate A/B/C.

Do not begin visible multi-save management UI, historical manager-profile mapping UI, backup-envelope redesign, cloud, accounts, QR pairing, synchronization, gameplay/scoring changes or framework rewrites as part of that persistence candidate.

PR #37 / `agent/v13-hardening` remains untrusted historical work. Do not revive its alternate shell or lockfile.
