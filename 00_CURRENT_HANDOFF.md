# Career Mode Showdown — Current Complete Handoff

Last updated: 2026-08-13 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
Active PR: #37 — `agent/v13-hardening`
Current candidate: v1.3.0 Recovery & Device Resilience Hardening / `1.3.0-r1`
Last production-proven application: v1.2.0 Installable Offline App / `1.2.0-r1`
Immutable v1.2 runtime merge: `e5acd4ae524f181242df3114b35fd2e812cd8f3b`
Proven v1.2 Pages deployment: `5891182853`

This is the active continuation handoff required by `00_HANDOFF_GOLDEN_RULE.md`. Current verified source, explicit later owner decisions, `PROJECT_STATE.md` and `NEXT_TASK.md` outrank stale historical prose.

## Owner direction

Continue development deeply. Perform substantial maintenance and bug fixing while preserving every proven function, accepted visual, gameplay rule, storage boundary, navigation authority and meaningful test gate. Investigate conflicting/missing/error information before changing product code. Make testing smarter, not weaker.

Work does not continue asynchronously after the browser/session closes. Repository handoffs are the continuity mechanism.

## v1.2 production authority

v1.2.0 / `1.2.0-r1` is technically production-proven:

- runtime merge `e5acd4ae524f181242df3114b35fd2e812cd8f3b`;
- Pages deployment `5891182853`;
- Stability `31716787806`;
- deployed smoke `94503946791`;
- Release Integration Burn-In `31716787876`, 2/2 complete stateful journeys.

Deployed Stability proved exact runtime bytes, provenance, Home presentation, licensed football visuals, Candidate A/B/C, install/offline behavior and the complete public journey. Technical proof remains distinct from a separately expressed owner visual acceptance statement.

The documentation-only v1.2 production seal merged at `fea3f83d93f99968de8d8527e04a9f1ab282d629`; it did not redefine runtime bytes.

## v1.3 maintenance findings and fixes

1. Candidate A blocked-read safety. Backup used a lossy storage reader that could turn a thrown canonical read into apparent absence. `js/backup.js` now uses strict exact raw snapshot authority and fails closed before creating an envelope. Regression blocks Legacy read, expects rejection, zero writes/removals and byte preservation.

2. Live reconnect media state. Repeated offline renders could overwrite the true pre-offline YouTube status with the OFFLINE override. Reconnect could re-enable the toggle while leaving stale text. State is now captured once and restored on offline → online. An executable VM contract runs the production function through offline → offline → online.

3. Update activation race. `activationRequested` was armed after awaiting worker activation response, allowing `controllerchange` to win. It is now armed before `CMS_ACTIVATE_UPDATE` and cleared on rejection.

4. Service Worker registration ownership. Existing same-scope registrations were redundantly re-registered. Existing registration now updates in place and returns; registration is created only when absent.

5. Empty previous-revision sentinel. v1.2 had no previous revision, so an unversioned shell request could collide with `PREVIOUS_RUNTIME_REVISION === ""` and be intercepted into `Response.error()`. Unversioned shell requests now fall through and previous matching requires a real revision.

6. v1.3 previous-runtime semantics. `1.2.0-r1` is now the explicit previous known-good shell. Manual rollback is one-shot so a healthy user is not indefinitely pinned to old code, while ordinary corruption fallback can still choose the verified previous whole runtime.

7. Truthful activation acceptance. The worker now awaits `skipWaiting()` before returning `CMS_ACTIVATION_ACCEPTED`; a failed activation is rejected rather than reported as accepted.

8. Cloud authority drift. Cloud foundation and tests previously hard-coded obsolete numeric roadmap labels. Current authority protects semantic order: proven offline → v1.3 hardening → stable local identity → Cloud Readiness → Cloud Backup Beta. Required identity, compare-and-swap, conflict, tombstone, privacy/security and no-direct-cloud-localStorage rules remain protected.

9. Release-authority drift. Candidate publication logic was hard-coded to v1.1.5-production/v1.2-candidate. `release-authority-v2.cjs` derives the last published production release dynamically from CHANGELOG while preserving all runtime, Candidate C, cloud and CI topology guards.

10. Dependency lock integrity. The v1.3 root lock metadata is rebuilt from the known-good v1.2 graph rather than hand-editing integrity hashes. This preserved the known-good `bare-path` checksum and corrected a second one-character optional `fsevents` integrity drift discovered during diff review. `npm ci` must remain the final dependency arbiter.

## Prototype proof

Before changing release identity, the v1.3 functional prototype at `da2e94c581fbd656f253b490c2765a2cdd5a1105` passed all 13 normal PR workflow families together, including Static App, Candidate B, Candidate C, Licensed Visuals and Stability.

Static logs explicitly passed Candidate A blocked-read safety, semantic cloud order, activation/registration/reconnect hardening, Service Worker unversioned fallthrough, executable reconnect behavior and the protected 27-block topology.

## Candidate identity freeze

Current candidate identity is being frozen coherently to v1.3.0 / `1.3.0-r1`:

- `js/app.js`: v1.3.0 and current visual stylesheet revision;
- `index.html`: meta, visible footer, Reus startup query and all seven eager JS/CSS queries use `1.3.0-r1`;
- `service-worker.js`: current `1.3.0-r1`, previous `1.2.0-r1`;
- `manifest.webmanifest`: install icon queries `1.3.0-r1`;
- `js/menuExperience.js`: dynamic Reus query `1.3.0-r1`;
- `package.json` / package-lock root metadata: v1.3.0;
- `RELEASE_V1.3.0.md`: RELEASE CANDIDATE;
- current PROJECT_STATE, NEXT_TASK and developer bootstrap: v1.3 candidate while v1.2 remains production truth.

README and CHANGELOG intentionally remain on v1.2 while the v1.3 release record says RELEASE CANDIDATE. Do not promote them before deployed proof.

## Protected architecture and product

Exactly two managers; Showdown lengths `[1,3,5,10]`; same league/different permanent clubs; max score 11; equal non-zero Draw; only 0-0 tiebreak; League/Club confirmations; Transfer and Season Review state machines are locked.

Exactly three canonical localStorage keys remain legal. `js/storage.js` remains sole canonical persistence/destructive mutation authority. `js/storageTransaction.js` remains raw transaction engine. `js/screens.js` remains sole route/history/Smart Back authority. Cache Storage contains application bytes only.

Candidate A is non-mutating export. Candidate B is strictly read-only. Candidate C remains the only import commit path and preserves immutable confirmed intent, strict exact raw snapshot, last-moment prewrite checks, transaction-owned rollback, anti-clobber ownership, post-write verification, byte-for-byte rollback verification and critical recovery on uncertainty.

Protected Marco Reus and accepted football-photo presentation remain unchanged.

## CI and performance

Keep 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs run 13; Burn-In is main/manual release-only. Keep evidence single-owner.

Protected ceilings remain 165,000 eager raw, 37,500 eager gzip, 95,000 Reus portrait, 260,000 combined startup, 2700 ms normal loading and 220 ms reduced motion. The pre-freeze prototype inherited 164,563 raw / 37,355 gzip; frozen candidate must re-prove ceilings.

## Exact continuation point

1. Inspect PR #37 current frozen-head workflow matrix.
2. Diagnose Static first if shared contracts fan out.
3. Confirm `npm ci` with the rebuilt known-good lock graph.
4. Fix only evidence-backed identity/runtime defects; do not touch gameplay or accepted visuals.
5. Obtain all 13 normal PR workflow families green together on the frozen `1.3.0-r1` candidate.
6. Merge through the normal protected PR path.
7. Require exact GitHub Pages deployed bytes, exhaustive deployed Stability and Release Integration Burn-In 2/2.
8. Only after deployed proof promote README/CHANGELOG/release authority from v1.2 to v1.3.
9. Then assign the future Local Profiles and Save Library version explicitly rather than silently renumbering historical roadmap labels.

Do not claim work can continue after the browser closes. This handoff exists so the next session can resume from verified repository state.
