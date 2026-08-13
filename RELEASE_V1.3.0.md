# Career Mode Showdown v1.3.0 — Recovery & Device Resilience Hardening

Status: RELEASE CANDIDATE
Application version: `v1.3.0`
Runtime asset revision: `1.3.0-r1`
Previous known-good runtime: `1.2.0-r2`
Release tag: `v1.3.0`
Release date: pending production proof

## Candidate purpose

v1.3.0 is the Recovery & Device Resilience Hardening release candidate built on the proven v1.2.0 Installable Offline App architecture. Production remains v1.2.0 / `1.2.0-r2` until this candidate is merged, deployed, exact-byte verified and proven at the public boundary.

This candidate does not change gameplay, scoring, the proven application shell, navigation ownership, the three-key canonical persistence model, accepted football photography, or the protected r2 loading composition and Settings-only install/update hierarchy.

## Evidence-backed resilience work

- Candidate A export fails closed when a canonical read cannot be trusted and never emits a checksum-valid incomplete backup.
- Candidate B remains strictly read-only analysis.
- Candidate C requires strict exact raw snapshot authority before any destructive plan can proceed; unavailable snapshot authority fails closed without mutation.
- Candidate C retains freshness rechecks, complete in-memory planning, transaction-owned mutation and rollback, anti-clobber ownership, exact post-write verification and critical recovery on ownership uncertainty.
- PWA offline/reconnect rendering preserves the real pre-offline external-media state.
- Existing Service Worker registration is reused and updated instead of redundantly registered.
- Update reload intent is armed before waiting-worker activation messaging.
- `CMS_ACTIVATE_UPDATE` verifies the candidate whole shell, awaits successful `skipWaiting()`, and only then emits `CMS_ACTIVATION_ACCEPTED`; a rejected `skipWaiting()` cannot be preceded by a success acknowledgement.
- Whole-shell cache recovery remains coherent across current and previous known-good runtimes, including browser restart while offline and fail-closed behavior when neither shell is usable.
- PWA lifecycle proof preserves the exact raw bytes of all three canonical localStorage values and never treats Cache Storage as user-data authority.

## Protected product and architecture invariants

- exactly two managers;
- Showdown lengths 1, 3, 5 or 10;
- same selected league and different permanent clubs for both managers;
- maximum Season score 11 and only a 0–0 Season uses the defined tiebreakers;
- League and Club confirmation checkpoints;
- Transfer Challenge and Season Review state machines;
- Statistics, Legacy, Trophy Room, Rule Book, Settings, Home/Continue Career, Create Showdown and Smart Back behavior;
- `js/screens.js` sole navigation/history/Smart Back authority;
- `js/storage.js` sole canonical persistence/destructive mutation authority;
- `js/storageTransaction.js` raw transaction engine;
- exactly three canonical localStorage keys;
- Settings-only install/update presentation;
- the r2 iOS installed-app loading composition based on bounded width-owned geometry and subject-safe Marco Reus framing;
- whole-runtime offline cache selection, never per-file revision mixing;
- no Service Worker or PWA user-data mutation;
- current startup performance ceilings.

## Candidate whole-shell relationship

Current candidate shell: `1.3.0-r1`
Immediate previous known-good whole shell: `1.2.0-r2`

The previous target is deliberately r2, not r1. `1.2.0-r2` is the current technically production-proven shell and therefore the only correct immediate recovery predecessor for the first v1.3 runtime.

## Release boundary

This record freezes candidate identity only. It is not merge or deployment authorization.

Before merge, all 13 normal PR workflow families must pass together at the exact frozen candidate head, including specialist release, offline lifecycle, Candidate A/B/C, Settings, visual and performance proof. Release Integration Burn-In remains main/manual release-only.

After merge, GitHub Pages deployment, exact public runtime-byte/provenance verification, deployed Stability/public journey and the required Burn-In must pass before v1.3.0 may be called technically production-proven. README and CHANGELOG production authority must not be promoted before that public proof exists.
