# Career Mode Showdown v1.3.0 Runtime Maintenance r2

Date: 2026-08-15 ET
Application version: `v1.3.0`
Runtime asset revision: `1.3.0-r2`
Previous known-good runtime: `1.3.0-r1`
Status: MERGED, DEPLOYED, EXACT-BYTE VERIFIED AND TECHNICALLY PRODUCTION-PROVEN
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

## Release purpose

This bounded runtime maintenance release adds presentation-only Local Profile display-label editing inside the existing lazy Save Library / Settings surface. It does not assign a new application milestone or broaden Local Profiles into generic profile CRUD.

The r2 whole-shell identity is required because the release changes runtime JavaScript and CSS. Publishing those bytes under the already production-proven `1.3.0-r1` cache key would prevent a coherent installed-app update and could mix release claims with stale cached behavior. `1.3.0-r1` therefore remains the exact immediate previous whole-shell recovery target.

## Shipped behavior

- A user can edit only a Local Profile `displayName`.
- Outer whitespace is trimmed and an empty label is rejected before any write.
- Saving the current value is a write-free no-op.
- Stable `profile_*`, `save_*` and `season_*` identities remain unchanged.
- Saved Showdown manager labels, in-memory Showdown labels and Legacy manager labels remain unchanged historical presentation.
- Equal visible Local Profile labels remain legal and never imply identity equality.
- Career Statistics and Trophy Room continue to consume the shared stable-identity Analytics authority and invalidate derived presentation when the profile label changes.
- The editor remains accessible by keyboard, restores focus after rerender and stays contained on Chromebook and mobile reduced-motion layouts.

## Protected architecture

`js/storage.js` remains public raw browser-storage authority. `js/storageTransaction.js` remains the raw transaction engine. `js/saveLibraryRuntime.js` remains Save Library product mutation authority. UI and Analytics code do not own canonical `localStorage`.

The profile-label mutation requires strict exact raw authority, transaction-owned mutation, mutation-owned failure handling, stale-authority rejection and exact post-write verification through the established Save Library commit path. It never creates a fourth canonical storage key or rewrites unrelated canonical bytes.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the only destructive import Apply stage and retains strict exact raw snapshot authority, transaction-owned rollback, anti-clobber ownership and byte-for-byte verification.

Gameplay, scoring, accepted FIFA 17-inspired presentation, Smart Back, licensed football imagery, startup timing and performance ceilings remain unchanged.

## Whole-shell relationship

Production shell: `1.3.0-r2`
Immediate previous known-good whole shell: `1.3.0-r1`

The release retains complete verified cache population, explicit safe-boundary activation and whole-shell current/previous recovery. Service Worker and Cache Storage continue to own application bytes only, never user data.

## Production proof

Frozen PR head `cfedec8dccde51a7a9932a1bd3a92cc91514e579` passed all 13 normal pull-request workflow families. PR #61 passed the independent unchanged-head/unchanged-base/review/thread gate and merged with expected-head protection to `67095a02188ebd246da0d0f2cd61158b8e9e504e`.

All 15 exact-merge push/deployment runs succeeded, including Pages `31894832195`, Release Integration Burn-In `31894832592`, Stability `31894832637` and deployed-site-smoke job `95036682319`. Pages deployment `5922244376` targets the exact merge. Independent verification matched 71 runtime files plus `service-worker.js` and `manifest.webmanifest` byte for byte and passed the public profile-label journey.

See `V1.3.0_R2_PRODUCTION_PROOF.md` for the frozen evidence.

Owner visual acceptance remains distinct from automated technical proof.
