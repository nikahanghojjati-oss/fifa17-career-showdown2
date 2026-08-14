# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-13 ET

## Production authority

Application: v1.3.0 — Recovery & Device Resilience Hardening
Production runtime: `1.3.0-r1`
Production previous known-good runtime: `1.2.0-r2`
Production status: merged, deployed, exact-byte verified and technically production-proven
Release PR: #42
Runtime merge: `094401b649954656e27e4a92d027e9532e84ccbf`
Production proof: `V1.3.0_PRODUCTION_PROOF.md`

Owner visual acceptance remains separate from automated technical proof and is not inferred here.

## Active development authority

The owner explicitly authorized continuation into Local Profiles / Save Library after the v1.3 production baseline was reconstructed and verified.

The feature release version remains pending. Do not reuse the historical `v1.3.0` planning label because `v1.3.0 — Recovery & Device Resilience Hardening` is already the production release.

Foundation PR #46 merged at `b76baf3be8107a57c5898f691d5178ae1d8a8547`.

That foundation adds:

- `js/saveLibraryFoundation.js` as pure, unloaded identity/migration planning logic;
- deterministic opaque save/profile/Season identity planning;
- fail-closed raw singleton migration planning;
- explicit refusal to infer historical manager identity from display-name equality;
- focused Save Library foundation contracts wired into the repository suite.

The foundation module is not part of the production shell, performs no localStorage writes, and does not change production runtime identity.

## Foundation validation

PR #46 passed all 13 normal PR workflow families on its implementation head and again on its final head before merge.

After merge at `b76baf3be8107a57c5898f691d5178ae1d8a8547`, all 14 permanent push-triggered workflow families succeeded.

Post-merge Stability `31758874808` passed:

- repository stability contracts;
- canonical Chromium stability/integration journey;
- deployed-site-smoke job `94641012805`.

The deployed smoke passed exact public runtime-byte verification, runtime-error provenance, Home visual audit, crop-safe football photography, Candidate A export, Candidate B analysis, Candidate C restore/recovery, install/offline boundaries and the complete public stateful journey.

Release Integration Burn-In `31758874804` passed 2/2 complete stateful journeys.

The foundation preserved eager startup at 164,563 raw / 37,355 gzip, below the locked 165,000 / 37,500 ceilings.

## Persistence and navigation authority

The currently canonical localStorage keys remain exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`careerModeShowdown.saveLibrary` is only a proposed future registry key represented by the merged planning foundation. It is not canonical and no runtime code currently writes it.

`js/storage.js` remains sole canonical persistence/destructive mutation authority. `js/storageTransaction.js` remains the raw transaction engine. `js/screens.js` remains sole navigation/history/Smart Back authority. `js/scoring.js` remains scoring authority. `js/analytics.js` remains analytics authority.

Cache Storage contains application bytes only and is never canonical user-data authority.

## Next persistence candidate

The next legal engineering task is a bounded canonical persistence integration candidate.

It must prove an atomic transition from the singleton active slot toward the Save Library while reasoning safely about the temporary four-name transition set:

- `saveLibrary`;
- `activeShowdown`;
- `legacyShowdowns`;
- `preferences`.

The result must never leave `activeShowdown` and `saveLibrary` as independent simultaneous canonical active-save authorities.

The current three-key model remains authoritative until that transition is explicitly implemented, transactionally proven, reviewed and promoted.

Do not expose the visible multi-save library, profile-management UI or historical identity mapping as part of this candidate.

## Closed resilience blockers and recovery locks

Candidate A blocked reads fail closed. Candidate B remains read-only. Candidate C requires strict exact raw snapshot authority before destructive Apply and otherwise performs no mutation. Candidate C preserves transaction-owned mutation and rollback, anti-clobber ownership, exact verification and critical recovery semantics.

Any persistence migration must retain immutable planning inputs where applicable, exact raw snapshot/preconditions, freshness barriers, last-moment prewrite checks, post-write verification, byte-for-byte rollback verification, corrupt-byte preservation and fail-closed critical recovery.

Service Worker activation acknowledges acceptance only after whole-shell verification and successful `skipWaiting()`. Offline/reconnect state, registration reuse, Settings focus preservation, whole-shell fallback and exact localStorage byte preservation remain protected.

## Installable Offline App authority

Current whole shell: `1.3.0-r1`
Immediate previous known-good shell: `1.2.0-r2`

Preserve verified atomic cache population, explicit safe update activation, Candidate C busy/recovery gating, whole-runtime cache selection, previous-known-good recovery, fail-closed behavior when no coherent shell exists, app-namespace-only cleanup, unrelated-cache preservation, worker-owned connectivity probing, nonfatal external-media degradation and lazy PWA loading.

Install/update controls remain Settings-only.

## Protected presentation

Preserve the r2 iOS installed-app loading correction: bounded mobile top band, independent subject-safe Marco Reus image box, width-owned composition and opacity/filter-only animation. Do not reintroduce viewport-height-driven image sizing or arbitrary crop/brightness hacks.

The proven FIFA 17-inspired menu shell and subject-safe football photography remain locked unless new evidence demonstrates a regression.

## Protected product rules

Exactly two managers. Showdown lengths are 1, 3, 5 or 10. Both managers use different permanent clubs from the same selected FIFA 17-era top-five league. Maximum Season score is 11. Equal non-zero Season scores remain Draw. Only 0–0 uses league position and then league points as tiebreakers.

League confirmation, Club confirmation, Transfer Challenge, Season Entry, Season Review, Statistics, Legacy, Trophy Room, Rule Book, Settings, Home/Continue Career, Create Showdown and Smart Back remain protected.

## Performance locks

Eager raw <=165,000 bytes; eager gzip <=37,500 bytes; startup Marco Reus portrait <=95,000 bytes; combined first-party startup <=260,000 bytes; normal loading minimum 2700 ms; reduced-motion loading 220 ms.

Do not raise limits to make CI pass.

## Validation topology

There are 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs run 13; Release Integration Burn-In is `main`/manual release authority.

## Branch authority

PR #46 is the merged Local Profiles / Save Library foundation authority.

PR #37 / `agent/v13-hardening` remains untrusted historical work and must not be merged or used as a baseline. PR #40 is the detailed v1.3 salvage/audit record. PR #42 is the v1.3 runtime release PR.

Cloud, accounts, synchronization, QR pairing, gameplay/scoring changes and framework migration remain future work and are not authorized by the Save Library foundation.
