# Career Mode Showdown — Post-v1 Roadmap Execution Guide

Last updated: 2026-08-14 ET
Status: current execution companion to the owner-approved post-v1 direction.

## 1. Current authority

Current production application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Current runtime revision: `1.3.0-r1`
Previous known-good whole shell: `1.2.0-r2`
Current shipped product layer: Visible Local Profiles / Save Library Core UI
Current runtime feature merge: `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`
Feature release version: intentionally unassigned
Current continuation authority: `00_CURRENT_HANDOFF.md`, `PROJECT_STATE.md`, `NEXT_TASK.md`

This file preserves dependency order and implementation intent. It cannot override current verified source or later explicit owner decisions.

v1.1 Data Safety and Recovery is complete. Candidate A/B/C are protected systems, not the current feature task.

v1.3.0 / `1.3.0-r1` remains the current whole-shell application baseline. The completed Local Profiles / Save Library chain advanced production functionality without assigning a new application or Service Worker release identity.

## 2. Permanent rules every roadmap milestone inherits

Gameplay integrity: exactly two managers; same selected league; different permanent clubs; Showdown lengths 1/3/5/10; 11-point maximum; equal non-zero scores Draw; only 0–0 uses league position then league points.

Architecture integrity: `js/screens.js` remains navigation authority; `js/storage.js` remains public raw browser-storage authority; `js/storageTransaction.js` remains the raw transaction engine; `js/saveLibraryRuntime.js` remains Save Library runtime mutation authority; `js/analytics.js` remains analytics authority; every changed runtime byte receives coherent cache identity; no framework rewrite merely for modernization.

Data-safety integrity: canonical storage authority remains exactly three public keys at a time. Before explicit cutover on an old singleton device those are `careerModeShowdown.activeShowdown`, `careerModeShowdown.legacyShowdowns` and `careerModeShowdown.preferences`. After successful cutover they are `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns` and `careerModeShowdown.preferences`. Candidate A stays non-mutating, Candidate B stays read-only, and Candidate C preserves immutable confirmed intent, strict exact raw snapshot/preconditions, stale-state barriers, complete planning, last-moment checks, transaction-owned mutation and ownership-scoped reverse rollback, anti-clobber ownership and exact verification. Service Worker/Cache Storage may never become canonical user-data authority.

Presentation integrity: accepted FIFA 17-inspired visual intent remains protected; mobile/Chromebook/reduced motion remain first-class; install/update presentation remains Settings-owned; persistent floating/sticky global overlays require explicit owner authorization.

Validation integrity: 14 permanent workflow families and 27 protected multiline executable blocks remain. Normal implementation PRs generally exercise 13; Release Integration Burn-In is main/manual release authority. Never weaken a gate just to obtain green CI.

## 3. Completed dependency chain

`v1.0.x Stability Lane`
→ `v1.1.x Data Safety and Recovery`
→ `v1.2.0 Installable Offline App`
→ `v1.2.0-r2 production maintenance hotfix`
→ `v1.3.0 Recovery & Device Resilience Hardening`
→ `Local Profiles / Save Library identity foundation`
→ `Local Profiles / Save Library canonical persistence`
→ `Local Profiles / Save Library runtime authority cutover`
→ `Visible Local Profiles / Save Library Core UI`

All of these dependency layers are technically production-proven at the current baseline.

## 4. Current milestone — v1.3.0 Recovery & Device Resilience Hardening

Implementation and technical production proof for the v1.3 whole-shell milestone are closed.

The release hardened browser/device lifecycle, exact local data preservation, Service Worker update/recovery behavior, cache corruption handling, Candidate C interruption/ownership safety, Settings focus/offline behavior, dependency/workflow integrity and release coherence without broad gameplay changes.

PR #37 remains historical and untrusted. Do not reopen its accidental alternate shell as a baseline.

Later Local Profiles / Save Library work deliberately remained on the same `v1.3.0` / `1.3.0-r1` application/runtime labels because no new release version was authorized.

## 5. Local Profiles and Save Library — completed dependency milestone, feature version unassigned

The owner-authorized local identity and multi-save direction is now implemented through four completed production layers:

1. Identity foundation — PR #46.
2. Canonical persistence integration — PR #48.
3. Runtime authority cutover — PR #51.
4. Visible Local Profiles / Save Library Core UI — PR #53.

The shipped product now has stable `profile_*`, `save_*` and `season_*` identities; a canonical multi-save registry; one explicit `activeSaveId`; additive New Showdown creation; explicit active-Save switching; scoped single-Save deletion; read-only Local Profiles; non-mutating old-singleton compatibility opening; fail-closed corrupt/dual-authority behavior; and Candidate A/B/C compatibility.

Display names remain labels rather than identity authority. Historical ambiguous manager mapping was not silently solved by name equality.

Cloud, accounts, authentication, pairing, synchronization, remote transport, distributed revisions and backup-envelope redesign remain excluded from this completed local milestone.

## 6. Current clean boundary

No next substantial implementation candidate is automatically assigned after the completed Save Library Core UI.

A future candidate must begin only after live repository reconstruction and explicit owner/dependency authorization.

Profile rename/edit is not generic CRUD. Current Showdown records also carry manager display labels, so a rename candidate must explicitly decide propagation, historical labeling and identity semantics.

Further Save Library interaction refinement requires reproduced usability evidence rather than speculative redesign.

## 7. Later approved direction

After stable local identity and Save Library product behavior, later outcomes remain dependency-ordered:

- Legacy/Achievements expansion without changing canonical scoring;
- deeper accessible analytics with `js/analytics.js` remaining calculation authority;
- optional content/league/challenge packs without replacing the accepted default Wheel;
- user-defined challenge content without changing canonical scoring authority;
- Cloud Readiness architecture with no production cloud dependency initially;
- opt-in Cloud Backup only after local identity/recovery and conflict handling are proven;
- private QR paired two-device use only after remote persistence/security is reliable;
- later private sharing/groups and any community/rankings only after explicit reliability, integrity, moderation, privacy and cost gates.

Historical numeric labels for these later outcomes are planning references and must be revalidated before implementation.

## 8. Cloud foundation boundary

`CLOUD_STORAGE_FOUNDATION.md` remains future architecture contract only. It authorizes no cloud runtime in the current product.

Future cloud work remains gated behind completed v1.3 resilience, stable local profile/save identity, the production Save Library foundation, explicit conflict/revision/tombstone semantics, authentication/authorization, privacy/retention policy, provider/cost ownership and rollback/export escape hatches.

No future cloud module may call localStorage directly.

The dependency order remains:

Current milestone — v1.3.0 Recovery & Device Resilience Hardening
→ Local Profiles and Save Library — completed dependency milestone, feature version unassigned
→ Cloud Readiness
→ opt-in Cloud Backup.

## 9. Current execution rule

Preserve proven `v1.3.0` / `1.3.0-r1` production and the completed Local Profiles / Save Library chain.

Respond to reproducible defects with root-cause analysis and focused regression evidence.

Do not begin another feature without current explicit authority.

Keep continuous handoff evidence under `00_HANDOFF_GOLDEN_RULE.md`.
