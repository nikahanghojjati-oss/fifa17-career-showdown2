# Career Mode Showdown v1.5.0-r2 Maintenance Handoff

Status: RELEASE CANDIDATE / PR #126 / CONNECTED ACCOUNT SETTINGS HOTFIX
Application version: `v1.5.0`
Runtime revision: `1.5.0-r2`
Previous known-good whole shell: `1.5.0-r1`
Starting main: `7fb403a802f944c94b0f1e474a78a31863c16b97`

## Purpose

This narrow hotfix fixes the production-installed-app timing race that could leave the Connected Account panel absent when Save Library & Settings opened before the deferred production Firebase runtime installed its Settings bridge.

The fix makes Connected Account mounting state-based rather than dependent on one early click. The runtime now checks for an already-open Settings overlay and observes the overlay lifecycle so the panel mounts after late runtime installation.

## Protected boundaries

- Installable Offline App and local Career Mode remain usable without Firebase.
- Canonical storage remains `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`.
- Candidate A remains non-mutating export, Candidate B remains read-only analysis, and Candidate C remains the sole destructive Apply authority.
- Candidate C retains transaction-owned mutation, strict exact raw snapshot authority, stale-state guards, ownership-scoped rollback, anti-clobber behavior and exact recovery verification.
- Google popup remains the only sign-in flow.
- Auth persistence remains browser-session-only.
- Firestore cache remains memory-only.
- Firebase UID remains the sole accountId source.
- The Spark Firestore write boundary remains self-account revision-0 create only; downstream device, invite, rivalry, session, idempotency and gameplay mutations remain denied.
- App Check enforcement remains OFF.
- No billing, Blaze, Cloud Run, Cloud Functions, Firebase Storage, additional Google scopes or provider-token extraction is introduced.

## Regression proof

`tests/browser/connected-account-settings-audit.cjs` deliberately delays the production Firebase runtime until after mobile Settings is already open, then requires `#sparkConnectedAccountPanel` and its Connected Account action to appear. This directly protects the production failure observed by the owner on the installed mobile app.

## Remote Joining relevance

This hotfix is required to finish the real production Connected Account proof that gates Registered Devices / Private Pairing. It does not add pairing, Connected Rivalry or Remote Joining itself. RJR remains 61/100 until new production capability evidence closes a fixed RJR-1 gap.

## Recovery

If `1.5.0-r2` proves defective after deployment, preserve local data and recover to the complete `1.5.0-r1` whole shell. Do not construct a mixed-version runtime.
