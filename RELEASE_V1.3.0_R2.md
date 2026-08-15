# Career Mode Showdown v1.3.0 Runtime Maintenance r2

Date: 2026-08-15 ET
Application version: `v1.3.0`
Runtime asset revision: `1.3.0-r2`
Previous known-good runtime: `1.3.0-r1`
Status: RELEASE CANDIDATE
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

## Candidate purpose

This bounded runtime maintenance candidate adds presentation-only Local Profile display-label editing inside the existing lazy Save Library / Settings surface. It does not assign a new application milestone or broaden Local Profiles into generic profile CRUD.

The r2 whole-shell identity is required because the candidate changes runtime JavaScript and CSS. Publishing those bytes under the already production-proven `1.3.0-r1` cache key would prevent a coherent installed-app update and could mix release claims with stale cached behavior. `1.3.0-r1` therefore remains the exact immediate previous whole-shell recovery target while this candidate is validated.

## Candidate behavior

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

Candidate shell: `1.3.0-r2`
Immediate previous known-good whole shell: `1.3.0-r1`

The candidate retains complete verified cache population, explicit safe-boundary activation and whole-shell current/previous recovery. Service Worker and Cache Storage continue to own application bytes only, never user data.

## Promotion boundary

This file does not claim production proof. Promotion requires one frozen exact head, every required pull-request workflow family, an independent unchanged-head/unchanged-base/review/thread gate, expected-head merge protection, successful exact-merge Pages and permanent workflow runs, exact deployed-byte verification, public profile-label journey proof and a separate production seal.

Owner visual acceptance remains distinct from automated technical proof.
