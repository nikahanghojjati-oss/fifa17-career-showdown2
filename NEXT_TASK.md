# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-13

Application version: v1.2.0
Runtime asset revision: `1.2.0-r1`
Release state: Installable Offline App technically production-proven
Production runtime merge SHA: `e5acd4ae524f181242df3114b35fd2e812cd8f3b`
Proven GitHub Pages deployment: `5891182853`
Production Stability: `31716787806` / deployed smoke `94503946791`
Release Integration Burn-In: `31716787876` — 2/2

## Immediate legal task

Begin v1.3.0 — Recovery & Device Resilience Hardening.

The goal is a maintenance-first hardening pass after the new install/offline layer. Investigate reproducible defects, recovery gaps, lifecycle races, stale/mixed information, browser/device failure states, install/update edge cases, cache corruption, storage failure behavior, responsive/accessibility regressions and release-authority drift before adding new product scope.

Do not begin cloud, accounts, QR pairing, two-device transport, gameplay changes or a framework rewrite.

The older execution-roadmap label that assigns v1.3.0 directly to Local Profiles and Save Library is stale as a current task. Local Profiles / Save Library remains future planned work, but its version assignment must be explicitly reconciled after v1.3 hardening.

## v1.3 hardening priorities

1. preserve the technically proven v1.2.0 / `1.2.0-r1` runtime as rollback authority;
2. audit Service Worker install/update/activation/recovery for browser close, reload, controller churn, partial cache, stale cache and consecutive-update edge cases;
3. audit exact preservation of all three canonical raw localStorage values across offline/update/recovery paths;
4. exercise quota errors, blocked reads/writes, corrupt raw values, interrupted Candidate C recovery and stale reviewed state without weakening transaction-owned rollback or anti-clobber protection;
5. audit runtime-notice/install/offline UI layering, focus, keyboard, touch, reduced motion, small mobile, Chromebook low-height and high-DPR behavior;
6. audit Smart Back and route/history ownership for lazy screens with no duplicate listeners or competing router state;
7. audit external-media failure/recovery and confirmed offline state without converting Cache Storage into a user-data authority;
8. audit dependency-lock integrity and CI owner topology so infrastructure failures are distinguished from product failures;
9. audit release/version/revision references, handoffs and historical docs for stale current-facing claims;
10. implement only defects supported by evidence, then prove each changed surface through its canonical owner workflow.

## Protected systems

Do not alter without explicit owner direction:

- exactly two managers;
- Showdown lengths `[1,3,5,10]`;
- same selected league / different permanent clubs;
- max-11 scoring and 0–0-only tiebreak;
- League and Club confirmation checkpoints;
- Transfer Challenge and Season Review state machines;
- Statistics/Legacy/Trophy calculations;
- centralized Smart Back/navigation ownership in `js/screens.js`;
- exactly three canonical localStorage keys and `js/storage.js` mutation authority;
- Candidate A non-mutating backup format v1;
- Candidate B read-only analysis;
- Candidate C immutable confirmed intent, strict exact raw snapshot, last-moment prewrite checks, transaction-owned rollback, byte-for-byte verification and anti-clobber semantics;
- protected Marco Reus and accepted football-photo presentation;
- startup budgets and local-first behavior;
- v1.2 whole-runtime cache-revision integrity.

## Testing rule

Preserve 14 permanent workflow families and 27 protected multiline executable blocks.

Keep testing single-owner. Candidate B owns one import browser proof, Candidate C one restore/recovery browser proof, local Stability provenance + offline lifecycle + complete journey, deployed Stability the exhaustive public boundary, and Release Integration Burn-In two complete stateful journeys on main/manual release use. Do not duplicate matrices, inflate budgets or weaken assertions to obtain green CI.

Maintenance work should normally use a dedicated branch/PR. If a failure is infrastructure-only, fix the infrastructure contract without changing production behavior. If a real product defect is found, fix the product and add the narrow regression proof that would have caught it.

## Production baseline

v1.2.0 exact-byte production proof:

- merge `e5acd4ae524f181242df3114b35fd2e812cd8f3b`;
- Pages `5891182853`;
- Stability `31716787806`;
- deployed smoke `94503946791`;
- Burn-In `31716787876` 2/2.

This production proof is technical. Do not fabricate a separate owner visual-acceptance statement.
