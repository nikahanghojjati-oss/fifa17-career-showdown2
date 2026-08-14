# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-14 ET

## Production authority

Application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Installable Offline App runtime label: `1.3.0-r1`
Immediate previous known-good whole shell: `1.2.0-r2`
Production status: merged, deployed, exact-byte verified and technically production-proven
Current production runtime feature merge: `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`
Current feature release version: intentionally unassigned
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

The original v1.3 Recovery & Device Resilience release remains the whole-shell baseline. The Local Profiles / Save Library dependency chain advanced production code without assigning a new application or Service Worker release identity.

## Completed Local Profiles / Save Library chain

1. Identity foundation — PR #46, merge `b76baf3be8107a57c5898f691d5178ae1d8a8547`.
2. Canonical persistence integration — PR #48, merge `d62ea1f62ec92af4a90de04a6ef182ed1bf44692`.
3. Runtime authority cutover — PR #51, merge `7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`.
4. Visible Local Profiles / Save Library Core UI — PR #53, merge `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`.

The fourth layer is complete, merged and production-proven.

## Visible Save Library product state

The application provides a user-facing local multi-save experience on top of the established canonical Save Library model.

Current behavior:

- Home visibly exposes `LOCAL / SAVE LIBRARY` through the established Settings navigation owner.
- Save Library UI remains lazy and is mounted first inside the Settings overlay.
- Empty, one-save and multi-save states are supported.
- New Showdown creation is additive and does not replace existing Saves.
- One Save may be explicitly active at a time through `activeSaveId`.
- Users may explicitly switch the active Save by stable identity.
- Users may delete exactly one Save without invoking full reset.
- Deleting a non-active Save does not change the active Save.
- Deleting the active Save leaves no implicit replacement; another Save must be explicitly selected.
- Local Profiles are visible and read-only.
- Equal visible manager names remain distinct stable identities.
- Local Profiles are retained after a Save is deleted in this product candidate.
- Old singleton devices remain non-mutating merely by opening Save Library; confirmed Start/Continue remains the migration boundary.
- Corrupt/dual/unverifiable authority is visibly blocked and fail-closed.
- Mutation rerenders preserve focus inside the established Settings dialog.
- UI remains contained at Chromebook and phone widths and under reduced motion.
- Save Library UI/CSS are part of the verified `1.3.0-r1` Installable Offline App whole shell.

## Runtime/API state

`js/saveLibraryRuntime.js` remains the only product-level Save Library mutation authority.

It exposes narrow operations for:

- detached library snapshots;
- additive Showdown creation;
- explicit active-Save switching;
- explicit single-Save deletion;
- existing active-save gameplay persistence;
- archive, backup projection, restore preparation and full reset compatibility.

Every product mutation continues to rely on exact owned-byte authority and the established storage transaction layer.

The UI never directly accesses canonical `localStorage`.

## Identity state

Stable prefixes:

- `save_*`
- `season_*`
- `profile_*`

Current generated IDs use 24 lowercase hexadecimal characters after the prefix.

Display names are never identity authority.

Same-name profiles are intentionally legal and permanently covered by deterministic/browser evidence.

Historical ambiguous manager mapping remains future product work unless separately authorized.

## Storage state

Before explicit Save Library activation on an old singleton device:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

After successful cutover:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

`careerModeShowdown.activeShowdown` is only a transitional migration/recovery slot after cutover. It is not a fourth permanent canonical key.

`js/storage.js` remains sole raw browser-storage authority.

## Recovery/import state

Candidate A: non-mutating export.

Candidate B: strictly read-only analysis.

Candidate C: only import stage permitted to mutate canonical restore state.

Candidate C destructive Apply still requires `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority.

Preserve exact preconditions, last-moment raw guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber verification, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery.

This architecture remains intentionally defensive because the roadmap may later evolve toward multi-device/private-room competition.

## Installable Offline App state

Whole-shell label remains exactly `1.3.0-r1`.

Previous known-good whole shell remains `1.2.0-r2`.

PR #53 added lazy `js/saveLibraryUI.js` and `css/saveLibrary.css` to the complete shell without changing the revision.

Service Worker and Cache Storage own application bytes only, never canonical user data.

## Performance state

Exact final PR #53 measurements:

- eager raw: `162781` bytes
- eager gzip: `37415` bytes
- lazy feedback: `4845` bytes
- Reus startup portrait: `88492` bytes
- combined first-party startup: `251273` bytes

Locked ceilings remain unchanged:

- eager raw <= `165000`
- eager gzip <= `37500`
- Reus startup portrait <= `95000`
- combined first-party startup <= `260000`
- normal loading minimum `2700 ms`
- reduced-motion loading `220 ms`

## Permanent evidence state

New/updated permanent evidence includes:

- `tests/contracts/save-library-product-contracts.cjs`;
- canonical contract-suite wiring;
- additive invariant in `tests/contracts/final-release-hardening.cjs`;
- `tests/browser/save-library-ui-audit.cjs`;
- Save Library browser journey in the existing Stability family;
- Save Library deployed-site audit in permanent post-merge smoke;
- whole-shell Service Worker inclusion.

The workflow-family count remains unchanged at 14 permanent workflow families and 27 protected multiline executable blocks.

## Exact production proof

Final PR #53 head:

`2021a0a2eaed26f0aca6639278de82afe2a28d6d`

All 13 normal PR workflow families succeeded on that exact head.

PR Stability: `31771109094` — success.
Candidate C: `31771109180` — success.
Static App: `31771109225` — success.

Runtime feature merge:

`9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`

All 14 permanent push workflow families succeeded on the exact runtime merge.

Release Integration Burn-In `31771269732` — success, both complete stateful passes.

Post-merge Stability `31771269740` — success, including deployed-site-smoke job `94677863736`.

Production Pages proof verified 71 `1.3.0-r1` runtime files byte-for-byte and passed runtime provenance, Home, visible Save Library, licensed football photos, Candidate A, Candidate B, Candidate C, Installable Offline App/offline boundary and the complete deployed journey.

The deployed complete journey recorded 70 checkpoints and 36 accessibility scans.

## Protected product surfaces

Preserve Home, Continue Career, Create Showdown, league confirmation, club confirmation, Transfer Challenge, Season Entry, Season Review, Season Summary, Statistics, Legacy, Trophy Room, Rule Book, Save Library/Settings, Smart Back, PWA/offline, accessibility, responsive containment, installed iOS behavior, licensed football photography and FIFA 17-inspired presentation.

## Gameplay rules

Exactly two managers.

Showdown lengths: `1`, `3`, `5`, `10`.

Same selected league, different permanent clubs.

Champions League +5, League +3, Domestic Cup +1.

100 League Points and/or 100 League Goals combined maximum +1.

Top Scorer and/or Top Assist combined maximum +1.

Maximum Season score 11.

Equal non-zero scores are Draws.

Only 0–0 invokes league position and then league points.

## Current clean boundary

Visible Local Profiles / Save Library Core UI is complete and production-proven.

No new substantial product candidate is currently assigned by repository authority.

Profile rename/edit, standalone profile creation, historical profile mapping, cloud/accounts/authentication, QR pairing, synchronization, remote transport, writer/device identity, distributed revision/conflict systems and backup/import redesign remain separate future candidates requiring explicit dependency/owner authorization.

Do not auto-start any of them merely because this phase is complete.
