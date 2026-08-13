# Career Mode Showdown — Post-v1 Roadmap Execution Guide

Last updated: 2026-08-13 ET
Status: current execution companion to the owner-approved post-v1 direction.

## 1. Current authority

Current production application: v1.3.0 — Recovery & Device Resilience Hardening
Current runtime revision: `1.3.0-r1`
Previous known-good runtime: `1.2.0-r2`
Release PR: #42
Runtime merge: `094401b649954656e27e4a92d027e9532e84ccbf`
Technical production proof: Stability `31755136265` / deployed-site-smoke `94629478166`; Burn-In `31755136240` 2/2
Current continuation authority: `00_CURRENT_HANDOFF.md`, `PROJECT_STATE.md`, `NEXT_TASK.md`

This file preserves dependency order and implementation intent. It cannot override current verified source or later explicit owner decisions.

v1.1 Data Safety and Recovery is complete. Candidate A/B/C are protected systems, not the current feature task.

v1.3.0 / `1.3.0-r1` is the current technically production-proven baseline. `1.2.0-r2` is the immediate previous known-good whole shell.

## 2. Permanent rules every roadmap milestone inherits

Gameplay integrity: exactly two managers; same selected league; different permanent clubs; Showdown lengths 1/3/5/10; 11-point maximum; equal non-zero scores Draw; only 0–0 uses league position then league points.

Architecture integrity: `js/screens.js` remains navigation authority; `js/storage.js` remains persistence/destructive mutation authority; `js/storageTransaction.js` remains the raw transaction engine; `js/analytics.js` remains analytics authority; every changed runtime byte receives coherent cache identity; no framework rewrite merely for modernization.

Data-safety integrity: exactly three canonical localStorage keys remain legal. Candidate A stays non-mutating, Candidate B stays read-only, Candidate C preserves immutable confirmed intent, strict exact raw snapshot/preconditions, stale-state barriers, complete planning, last-moment checks, transaction-owned mutation and rollback, anti-clobber ownership and exact verification. Service Worker/Cache Storage may never become canonical user-data authority.

Presentation integrity: accepted FIFA 17-inspired visual intent remains protected; mobile/Chromebook/reduced motion remain first-class; install/update presentation remains Settings-owned; persistent floating/sticky global overlays require explicit owner authorization.

Validation integrity: 14 permanent workflow families and 27 protected multiline executable blocks remain. Normal PRs exercise 13; Release Integration Burn-In is main/manual release-only. Never weaken a gate just to obtain green CI.

## 3. Completed dependency chain

`v1.0.x Stability Lane`
→ `v1.1.x Data Safety and Recovery`
→ `v1.2.0 Installable Offline App`
→ `v1.2.0-r2 production maintenance hotfix`
→ `v1.3.0 Recovery & Device Resilience Hardening`

All are technically production-proven at the current baseline.

## 4. Current milestone — v1.3.0 Recovery & Device Resilience Hardening

Implementation and technical production proof are closed. The current activity is release observation and preservation of the proven baseline unless new evidence requires a focused correction.

The release hardened browser/device lifecycle, exact local data preservation, Service Worker update/recovery behavior, cache corruption handling, Candidate C interruption/ownership safety, Settings focus/offline behavior, dependency/workflow integrity and release coherence without broad product changes.

PR #37 remains historical and untrusted. Do not reopen its accidental alternate shell as a baseline.

Closing v1.3 does not itself authorize the next structural feature. Version assignment for later milestones remains pending current owner/repository authority.

## 5. Local Profiles and Save Library — future feature milestone, version pending

This future approved direction remains dependency-ordered but is not current implementation scope.

Required direction remains stable profile identity, stable save identity independent of display names, a multi-save registry, explicit active-save selection, rollback-safe migration from the singleton model and Candidate A/B/C compatibility. Cloud remains excluded from that local milestone.

Do not silently assign a version or begin implementation solely because v1.3 is closed.

## 6. Later approved direction

After stable local identity exists, later outcomes remain dependency-ordered:

- Legacy/Achievements expansion without changing canonical scoring;
- deeper accessible analytics with `js/analytics.js` remaining calculation authority;
- optional content/league/challenge packs without replacing the accepted default Wheel;
- user-defined challenge content without changing canonical scoring authority;
- Cloud Readiness architecture with no production cloud dependency initially;
- opt-in Cloud Backup only after local identity/recovery and conflict handling are proven;
- private QR paired two-device use only after remote persistence/security is reliable;
- later private sharing/groups and any community/rankings only after explicit reliability, integrity, moderation, privacy and cost gates.

Historical numeric labels for these later outcomes are planning references and must be revalidated before implementation.

## 7. Cloud foundation boundary

`CLOUD_STORAGE_FOUNDATION.md` remains future architecture contract only. It authorizes no cloud runtime in the current product.

Future cloud work remains gated behind v1.3 closure, stable local profile/save identity, explicit conflict/revision/tombstone semantics, authentication/authorization, privacy/retention policy, provider/cost ownership and rollback/export escape hatches. No future cloud module may call localStorage directly.

## 8. Current execution rule

Preserve proven `v1.3.0` / `1.3.0-r1` production. Respond to reproducible defects with root-cause analysis and focused regression evidence. Do not begin future feature scope without current explicit authority. Keep continuous handoff evidence under `00_HANDOFF_GOLDEN_RULE.md`.
