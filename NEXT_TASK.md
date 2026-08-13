# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-13

Application version: v1.2.0
Production runtime asset revision: `1.2.0-r1`
Hotfix candidate runtime asset revision: `1.2.0-r2`
Release state: owner-authorized visual/install hotfix in PR #38
Previous known-good runtime: `1.2.0-r1`

## Immediate legal task

Finish and ship the v1.2.0 / `1.2.0-r2` hotfix before returning to v1.3 hardening. This is maintenance of the v1.2.0 Installable Offline App milestone, not a new feature milestone.

The hotfix has exactly two product defects in scope:

1. iOS standalone loading composition. Separate safe-area/viewport handling from visual composition, anchor the Reus image in a stable mobile box, prevent installed-app height from stretching the composition, and preserve face/body/leg framing intentionally.
2. Install UI hierarchy. Remove floating install/status UI from all screens and remove any layout reservation created for it. Keep install/offline/update logic, but place install/update actions only in Settings.

The release must add regression protection for:

- desktop loading;
- low-height windowed desktop;
- narrow mobile browser;
- iOS standalone installed-app height;
- maximum bounded mobile top band;
- stable Reus photo-box anchor and subject-safe crop;
- loading identity/status/lower-copy relationships;
- absence of global floating/sticky install presentation;
- Settings-owned install/update controls;
- exact whole-runtime cache coherence with r1 retained as previous known-good runtime.

Screenshot evidence for the sensitive loading archetypes is a formal visual release gate. Element existence alone is not sufficient.

## Production baseline

v1.2.0 / `1.2.0-r1` remains current production until r2 is merged and deployed:

- merge `e5acd4ae524f181242df3114b35fd2e812cd8f3b`;
- Pages `5891182853`;
- Stability `31716787806`;
- deployed smoke `94503946791`;
- Burn-In `31716787876` 2/2.

Do not rewrite `RELEASE_V1.2.0.md`. The r2 hotfix owns `RELEASE_V1.2.0_R2.md` and must not be marked production-proven before deployed evidence exists.

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
- protected Marco Reus source and accepted Home/desktop football-photo presentation;
- startup budgets and local-first behavior;
- whole-runtime cache-revision integrity.

## Testing rule

Preserve 14 permanent workflow families and 27 protected multiline executable blocks.

Keep testing single-owner. Candidate B owns one import browser proof, Candidate C one restore/recovery browser proof, local Stability provenance + offline lifecycle + complete journey, deployed Stability the exhaustive public boundary, and Release Integration Burn-In two complete stateful journeys on main/manual release use.

The loading visual regression belongs to the existing V1 Visual Immersion owner. Settings install hierarchy belongs to Settings static contracts plus Stability offline browser proof. Do not create duplicate competing matrices.

A runtime hotfix revision may be `r2` or later, but every runtime reference, Service Worker cache identity, manifest icon revision and lazy asset must still match the exact active revision. Tests must reject mixed revisions, not reject legitimate numbered hotfix generations.

After r2 is production-proven, resume v1.3.0 — Recovery & Device Resilience Hardening. Cloud, accounts, QR pairing, two-device transport and gameplay changes remain out of scope.
