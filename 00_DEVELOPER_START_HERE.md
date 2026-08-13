# Career Mode Showdown — Developer Start Here

Last updated: 2026-08-13 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Purpose: canonical first read for a new developer session.

## Sixty-second state

Application: `v1.3.0` — Recovery & Device Resilience Hardening
Production runtime: `1.3.0-r1`
Previous known-good runtime: `1.2.0-r2`
Status: merged, deployed, exact-byte verified and technically production-proven
Release PR: #42
Runtime merge: `094401b649954656e27e4a92d027e9532e84ccbf`
Stability: `31755136265` / deployed-site-smoke `94629478166`
Burn-In: `31755136240` — 2/2
Production proof: `V1.3.0_PRODUCTION_PROOF.md`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Technical production proof is complete. Owner visual acceptance remains a separate evidence channel.

## Required read order

1. `00_HANDOFF_GOLDEN_RULE.md`
2. this file
3. `00_CURRENT_HANDOFF.md`
4. `PROJECT_STATE.md`
5. `NEXT_TASK.md`
6. `V1.3.0_PRODUCTION_PROOF.md`
7. `RELEASE_V1.3.0.md`
8. `CAREER_MODE_SHOWDOWN_V1.3.0_MAINTENANCE_HANDOFF.md`
9. `POST_V1_ROADMAP_EXECUTION.md`
10. `00_MASTER_DEVELOPER_CONTEXT.md` when deeper history is needed.

Verify current `main` at session start. Source wins over stale historical prose.

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

Canonical localStorage keys remain exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

## Recovery contract

Candidate A remains non-mutating export. Candidate B remains strictly read-only analysis. Candidate C is the only import stage allowed to commit canonical state. A legal Apply preserves immutable confirmed intent, strict exact raw snapshot/preconditions, stale-state barriers, complete in-memory planning, last-moment exact-byte checks, transaction-owned mutation and rollback, anti-clobber ownership, post-write verification, byte-for-byte rollback verification, corrupt-byte preservation and critical recovery on uncertainty.

## Installable Offline App locks

Current shell: `1.3.0-r1`. Immediate previous known-good shell: `1.2.0-r2`.

Preserve atomic verified cache population, explicit safe update activation, Candidate C activation gating, whole-runtime selection, corruption-aware current/previous recovery, app-namespace-only cleanup, worker-owned connectivity probing, nonfatal external-media degradation and lazy PWA loading.

`CMS_ACTIVATE_UPDATE` must verify the whole shell and await successful `skipWaiting()` before acknowledging acceptance.

Install/update presentation remains Settings-only.

## Visual locks

Preserve the r2 iOS installed-app loading composition: bounded mobile top band, independent subject-safe Reus image box, width-owned composition and opacity/filter-only animation. Do not use viewport-height-sensitive sizing or arbitrary crop/brightness hacks.

## Validation and performance

There are 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs run 13; Burn-In is main/manual release-only.

Protected ceilings: eager raw <=165,000; eager gzip <=37,500; Reus portrait <=95,000; combined startup <=260,000 bytes; normal loading minimum 2700 ms; reduced-motion loading 220 ms.

## Current continuation

v1.3.0 — Recovery & Device Resilience Hardening is technically production-proven. Preserve the baseline unless new owner evidence or an explicitly authorized later milestone requires work.

PR #37 / `agent/v13-hardening` remains untrusted historical work. PR #40 is the detailed salvage/audit record; PR #42 is the release PR. Do not revive PR #37's alternate shell or lockfile.

Local Profiles/Save Library, cloud, accounts, QR pairing, synchronization, gameplay/scoring changes and framework rewrites remain outside the current authorized task.
