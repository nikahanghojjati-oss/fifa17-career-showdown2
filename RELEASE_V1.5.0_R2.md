# Career Mode Showdown v1.5.0-r2

Application version: `v1.5.0`
Runtime asset revision: `1.5.0-r2`
Previous known-good runtime: `1.5.0-r1`
Release type: production runtime hotfix

## Purpose

Fix the production Connected Account Settings surface so it appears reliably even when the optional Settings module opens before the deferred production Firebase runtime installs its Settings bridge.

## Fix

- Detect an already-open Settings overlay when the production Firebase runtime loads late.
- Observe the Settings overlay lifecycle instead of depending only on the original `#settingsButton` click timing.
- Preserve the existing lazy Firebase Auth + memory-only Firestore behavior.
- Preserve Google popup sign-in, session-only Auth persistence, Firebase UID account identity, zero billing and the strict self-account revision-0 Firestore bootstrap boundary.
- Add a mobile browser regression audit that deliberately delays the Firebase runtime until after Settings is open and requires the Connected Account panel to appear.

## Recovery

`1.5.0-r1` remains the immediate previous whole-shell recovery target. No local Save Library, Legacy, preferences, scoring, gameplay or recovery authority is changed by this hotfix.

## Remote Joining relevance

This hotfix restores the production UI entry point required to complete real Connected Account proof. It does not itself implement pairing, Connected Rivalry or Remote Joining.
