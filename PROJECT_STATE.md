# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-13 ET

## Production authority

Application: v1.2.0 — Installable Offline App
Production runtime: `1.2.0-r2`
Production previous known-good runtime: `1.2.0-r1`
Production status: merged, deployed, exact-byte verified and technically production-proven
Current main at candidate freeze start: `49c72abaea30c9d3ed1a3b2f1247315d6c7656da`
Production proof: `V1.2.0_R2_PRODUCTION_PROOF.md`

The public production authority remains v1.2.0 / `1.2.0-r2` until the v1.3 candidate is merged, deployed and proven at the public boundary. Owner visual acceptance remains separate from automated technical proof.

## Current candidate authority

Current milestone — v1.3.0 — Recovery & Device Resilience Hardening.

Candidate application version: `v1.3.0`
Candidate runtime revision: `1.3.0-r1`
Candidate immediate previous known-good whole shell: `1.2.0-r2`
Development branch: `agent/v13-r2-hardening`
Draft PR: #40 — `v1.3 audit: salvage r2 resilience hardening safely`

The candidate is a mechanical identity freeze on the proven r2 shell after resilience blockers were closed. It is not production authority and must remain unmerged until exact-head validation is complete.

PR #37 / `agent/v13-hardening` remains an untrusted historical branch. Its alternate shell replacement is not a valid v1.3 baseline and must not be merged or copied.

## Closed resilience blockers

- Candidate A fails closed when exact canonical reads cannot be trusted.
- PWA reconnect rendering preserves true pre-offline external-media status.
- Activation reload intent is armed before worker activation messaging.
- Existing Service Worker registration is reused and updated rather than redundantly registered.
- Settings rerenders preserve focused controls and dialog focus ownership.
- Candidate B/C screenshot artifact semantics distinguish product/browser failure from missing proof after success.
- Whole-shell offline lifecycle proof covers repeated upgrade/fallback, browser restart, previous-shell corruption and both-shell-corrupt fail-closed behavior without mixed revisions.
- PWA lifecycle proof preserves exact opaque raw localStorage bytes under all three canonical keys.
- `CMS_ACTIVATE_UPDATE` verifies the candidate shell, awaits successful `skipWaiting()`, then emits `CMS_ACTIVATION_ACCEPTED`; rejection cannot follow a premature success acknowledgement.
- Candidate C Apply requires `captureCareerModeRawRestoreSnapshot()` and returns `snapshot-unavailable` without mutation if strict exact raw snapshot authority is unavailable.

## Persistence and navigation authority

Exactly three canonical localStorage keys remain legal:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`js/storage.js` remains sole canonical persistence/destructive mutation authority. `js/storageTransaction.js` remains the raw transaction engine. Candidate C remains the only import stage allowed to mutate canonical state and retains immutable confirmed intent, strict exact raw snapshot/precondition handling, last-moment prewrite checks, complete in-memory planning, transaction-owned mutation/rollback, anti-clobber ownership, post-write verification, byte-for-byte rollback verification and critical recovery on uncertainty.

`js/screens.js` remains sole navigation/history/Smart Back authority. `js/scoring.js` remains scoring authority. `js/analytics.js` remains analytics authority.

Cache Storage contains application bytes only and is never canonical user-data authority.

## Installable Offline App authority

Candidate current shell: `1.3.0-r1`
Candidate immediate previous known-good shell: `1.2.0-r2`

Preserve complete verified cache population, no automatic install-time activation, explicit Update Ready activation only at safe boundaries, Candidate C busy/recovery gating, whole-runtime cache selection, previous-known-good recovery, fail-closed behavior when no coherent shell is usable, cleanup restricted to app cache namespaces, unrelated-cache preservation, Service Worker-owned connectivity probing, nonfatal external-media degradation and lazy PWA loading.

Install/update controls remain Settings-only.

## Protected r2 presentation

The iOS standalone loading fix remains protected: bounded mobile top band, independent subject-safe Marco Reus image box, width-owned composition and opacity/filter-only animation. Do not return to viewport-height-driven image sizing, arbitrary object-position changes, random brightness/contrast adjustments or startup DOM replacement.

The proven FIFA 17-inspired menu shell and subject-safe licensed football photography remain locked unless new evidence demonstrates a regression.

## Protected product rules

Exactly two managers. Showdown lengths are 1, 3, 5 or 10. Both managers use different permanent clubs from the same selected FIFA 17-era top-five league. Maximum Season score is 11. Equal non-zero Season scores remain Draw. Only 0–0 uses league position and then league points as tiebreakers.

League confirmation, Club confirmation, Transfer Challenge, Season Entry, Season Review, Statistics, Legacy, Trophy Room, Rule Book, Settings, Home/Continue Career, Create Showdown and Smart Back remain protected.

## Performance locks

- eager raw code <= 165,000 bytes;
- eager gzip <= 37,500 bytes;
- startup Marco Reus portrait <= 95,000 bytes;
- combined first-party startup <= 260,000 bytes;
- normal loading minimum 2700 ms;
- reduced-motion loading 220 ms.

Do not raise limits to make CI pass.

## Validation topology

There are 14 permanent workflow families. Normal PRs run 13; Release Integration Burn-In is main/manual release-only. There are 27 protected multiline executable blocks.

Candidate identity must be proven by all 13 normal workflow families at the exact frozen head before merge. Failures must be classified as product, browser/test-runtime, infrastructure, CI ownership/configuration or stale-contract defects before editing source.

## Current legal next action

Validate the frozen v1.3.0 / `1.3.0-r1` candidate at its exact PR #40 head. First inspect specialist static/release/offline/performance proof, then require all 13 normal workflow families to finish green together. Do not push documentation-only commits during heavy proof generations. Do not merge or deploy until exact-head proof is complete.

After merge, require Pages deployment success, exact deployed byte/provenance verification, deployed Stability/public journey and the required Release Integration Burn-In before promoting README/CHANGELOG or calling v1.3.0 technically production-proven.

Local Manager Profiles, Save Library registry redesign, cloud, accounts, synchronization, QR pairing, gameplay/scoring changes and framework migration remain future work and are not legal v1.3 hardening scope.
