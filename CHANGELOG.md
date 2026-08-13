# Career Mode Showdown Changelog

Last updated: 2026-08-13 ET

## v1.2.0 runtime hotfix r2 — production

Current runtime: `1.2.0-r2`
Previous known-good runtime: `1.2.0-r1`
Status: merged, deployed, exact-byte verified and technically production-proven.

Shipped corrections:

- iOS standalone loading composition is decoupled from installed-app viewport-height growth. The mobile loading art uses a bounded width-owned top band, stable subject-safe image box and an entrance animation that cannot move protected layout geometry.
- Global floating install/status presentation is removed. Install/update actions live only inside Settings; Service Worker/cache/connectivity/update/recovery behavior remains intact.
- Loading visual regression coverage protects desktop, low-height desktop, narrow mobile browser and iOS standalone-height archetypes with relationship-based assertions and screenshots.
- Tests explicitly protect Settings-only install presentation and reject mixed runtime revisions.

Production evidence:

- release PR #39;
- merge `2179b7928602b9579dc6e129c40b8739082de80a`;
- post-merge visual-test authority `e966a5a44927992e2e33f602434c5311bf7caee7`;
- Stability `31740111919`;
- deployed-site-smoke job `94581704562`;
- V1 Visual Immersion `31740111961`;
- Release Integration Burn-In `31740111986` — 2/2 complete stateful journeys passed.

See `RELEASE_V1.2.0_R2.md` and `V1.2.0_R2_PRODUCTION_PROOF.md`.

## v1.2.0 runtime r1 — previous known-good

`1.2.0-r1` introduced the installable/offline shell and remains immutable previous known-good rollback evidence. Do not rewrite its release records to describe r2.

Immutable r1 details remain in:

- `RELEASE_V1.2.0.md`
- `CAREER_MODE_SHOWDOWN_V1.2.0_MAINTENANCE_HANDOFF.md`

The complete pre-v1.2 changelog remains archived in `CHANGELOG_PRE_V1.2_ARCHIVE.md`.

## Next milestone

v1.3.0 — Recovery & Device Resilience Hardening, beginning from current verified `1.2.0-r2` main.

PR #37 is an untrusted open draft until re-audited against current main because it contains a known accidental production-shell replacement. See `00_CURRENT_HANDOFF.md` and `NEXT_TASK.md`.