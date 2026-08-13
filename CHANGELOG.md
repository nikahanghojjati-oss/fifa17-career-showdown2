# Career Mode Showdown Changelog

Last updated: 2026-08-13 ET

## v1.3.0 — Recovery & Device Resilience Hardening — production

Current runtime: `1.3.0-r1`
Previous known-good runtime: `1.2.0-r2`
Status: merged, deployed, exact-byte verified and technically production-proven.

Shipped hardening:

- Candidate A blocked canonical reads fail closed.
- Candidate B remains read-only.
- Candidate C destructive Apply now requires strict exact raw snapshot authority before mutation and preserves transaction-owned rollback/anti-clobber verification semantics.
- Service Worker activation acceptance cannot be emitted before successful whole-shell verification and `skipWaiting()` resolution.
- Existing Service Worker registration reuse, reconnect-state preservation, Settings focus continuity, whole-shell corruption/restart recovery and exact localStorage byte preservation are protected.
- v1.3 identity is coherent across app/package/runtime/eager assets with `1.2.0-r2` as the immediate previous whole shell.
- The proven r2 DOM, iOS installed-app loading composition and Settings-only install/update hierarchy are preserved.

Production evidence:

- frozen candidate `b8d92e9a8a9eec2820c439c0dd2699e9d825a91f`;
- release PR #42;
- runtime merge `094401b649954656e27e4a92d027e9532e84ccbf`;
- Pages `31755135819`;
- Stability `31755136265`;
- deployed-site-smoke `94629478166`;
- Release Integration Burn-In `31755136240` — 2/2.

See `RELEASE_V1.3.0.md` and `V1.3.0_PRODUCTION_PROOF.md`.

## v1.2.0 runtime hotfix r2 — previous known-good

`1.2.0-r2` is the immediate previous known-good whole shell for v1.3. It corrected iOS standalone loading composition and moved install/update presentation into Settings only. Its immutable proof remains in `RELEASE_V1.2.0_R2.md` and `V1.2.0_R2_PRODUCTION_PROOF.md`.

## v1.2.0 runtime r1 — historical rollback evidence

`1.2.0-r1` introduced the Installable Offline App shell and remains immutable historical release evidence. See `RELEASE_V1.2.0.md` and `CAREER_MODE_SHOWDOWN_V1.2.0_MAINTENANCE_HANDOFF.md`.

The complete pre-v1.2 changelog remains archived in `CHANGELOG_PRE_V1.2_ARCHIVE.md`.
