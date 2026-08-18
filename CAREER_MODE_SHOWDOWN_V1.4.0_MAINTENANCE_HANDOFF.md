# Career Mode Showdown v1.4.0 Maintenance Handoff

Last updated: 2026-08-17 ET
Status: PRODUCTION PROVEN (visible version seal)
Application version: `v1.4.0`
Production runtime: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`
Release record: `RELEASE_V1.4.0.md`

## Milestone

Current milestone — **v1.4.0 — Product Deepening**.

This seal formalizes the already-shipped Phase B Save Library Experience 2.0 first slice (PR #70) and Phase C Showdown Home & Season Experience first slice (PR #73) under a single visible application version. Public site footer and `app-asset-revision` now report `v1.4.0` / `1.4.0-r1` so progress is user-visible, not only internal PR numbers.

## Production merges retained

- Multi-Save formatVersion 2 portability: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27` (PR #67)
- Phase A authority sync: `372e5570391616efd737fc4780ad0b51d8ec5ce4` (PR #68)
- Phase B authority: `d5027f575ee416a1ad3f36b61fc09602e8239174` (PR #69)
- Phase B first-slice product: `65b6c9db0a070b6e5e992a39dffeee23df0c6f08` (PR #70)
- Phase B first-slice seal: `482013ca78859f45d1a2fd4906530ab83abb9266` (PR #71)
- Phase C authority: `39b1447a003c3440debbe61ea37fab18b0bb4057` (PR #72)
- Phase C first-slice product: `dec1d3ba8182c3f62019974dd1704c7c9124def6` (PR #73)

## Recovery and offline authority

Exactly three canonical localStorage keys remain legal. `js/storage.js` remains sole canonical persistence/destructive mutation authority. Service Worker/Cache Storage remains application-byte authority only.

Current whole shell: `1.4.0-r1`
Previous known-good whole shell: `1.3.0-r2`

Preserve complete verified cache population, explicit safe-boundary update activation, Candidate C busy/recovery gating, whole-runtime cache selection, previous-known-good fallback, corruption detection and fail-closed behavior when no coherent shell is usable.

## Product locks

Exactly two managers. Private two-manager companion only. Public community / global leaderboard **ELIMINATED**. Private remote joining **BLOCKED** until dependency order is ready.

## Performance ceilings (unchanged)

- eager raw <= 165,000 bytes
- eager gzip <= 37,500 bytes
- Reus startup portrait <= 95,000 bytes
- combined first-party startup <= 260,000 bytes
- normal loading minimum 2700 ms
- reduced-motion loading 220 ms

## Recovery ownership (protected)

Candidate C remains the only destructive import Apply stage. It requires strict exact raw snapshot authority via `captureCareerModeRawRestoreSnapshot()`, transaction-owned mutation and ownership-scoped reverse rollback, anti-clobber ownership, exact post-write verification and byte-for-byte rollback verification.

The Installable Offline App whole shell is `1.4.0-r1` with immediate previous known-good `1.3.0-r2`.

## Stop condition

Phase B first slice and Phase C first slice are closed. **No product candidate is currently authorized.** Do not expand Product Deepening, open Season UX expansion, Career Statistics 2.0, or Remote Foundation work without a further explicit owner instruction.

`NEXT_TASK.md` owns implementation authorization. `PROJECT_STATE.md` owns current deployed product state.
