# Final RJR-1 Remote Joining Acceptance — 2026-09-05

Status: ACCEPTED / RJR-1 100/100 CANDIDATE FOR FINAL PUBLICATION

## Fixed readiness result

The fixed `RJR-1` denominator remains 100 points. Evidence reconciliation closes the final two incomplete capability domains without changing the model or its weights:

- deterministic sync and recovery safety: 20/20
- identity, authentication, authorization and trust: 20/20
- production cloud and security activation: 20/20
- devices, pairing, Connected Rivalry and actual Remote Joining: 30/30
- real-device hardening and stable release: 10/10

Total: 100/100.

No points are awarded for PR count, source volume, CI volume, merge mechanics, documentation, WEC/SLE/SNS work, release numbering, or the validator correction itself.

## Qualifying physical acceptance

Production remained unchanged at `v1.9.1 / 1.9.1-r2`.

The accepted sanitized Stage 5I evidence used two genuine physical devices and two independent networks:

- Chromebook host on Home WiFi.
- iPhone peer on cellular data.
- Both exports identify the same one-way private-session fingerprint.
- Both converge to `ACTIVE` revision 1.
- The participating iPhone records a real ordered browser offline transition followed by browser online recovery.
- After recovery the iPhone returns to the same `ACTIVE` revision 1 session rather than a replacement or duplicate session.
- Both devices converge to terminal `CLOSED` revision 2.
- Later reads remain `CLOSED` revision 2 with no resurrection.
- Recorder evidence is page-memory-only/export-only, contains no raw session capability or raw account/device/rivalry authority ID, performs no recorder network writes, and does not alter canonical local save storage.

This closes the previously uncredited physical two-device/two-network Remote Joining capability cluster exactly once. Host, Join, Refresh, offline, online, recovery and Close are not counted as arbitrary separate score points.

## Final stable release acceptance

PR #197 merged to `main` as `264237056896d2b9d84f69c908da5b14e2b8e97d` after exact-head review and all 15 permanent PR workflow families passed.

Post-merge proof on that unchanged main is green:

- all 15 main-push workflow families passed;
- Release Integration Burn-In run `33980841831` passed both independent complete journeys;
- Stability run `33980841859` passed contracts, Chromium Stability, production runtime-byte verification, App Check production-path proof, visual/Save Library/identity/analytics checks, Candidate A/B/C checks, install/offline boundaries and the complete deployed-site journey.

This closes the final stable-release hardening point.

## Production and cost locks

The acceptance does not authorize or require any billing change.

Permanent constraints remain:

- Billing must remain OFF.
- Firebase remains Spark.
- Blaze, Cloud Billing, Cloud Run, Cloud Functions and billing-required services remain forbidden.
- App Check enforcement remains OFF unless a later separately authorized zero-billing-safe architecture changes that lock.
- Firestore browser persistence remains memory-only.
- Google Authentication remains popup-only with `browserSessionPersistence` and no extra scopes.
- Canonical local storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`.
- Candidate A remains non-mutating.
- Candidate B remains read-only.
- Candidate C remains the sole destructive remote-to-local gameplay Apply authority with backup-first strict rollback protections.
- Exactly two private managers remain mandatory.
- No public discovery, lobby, matchmaking, community, rankings or global leaderboard is introduced.
- Raw private pairing/session capabilities must not be durably retained.

## What RJR100 means and what it does not mean

`RJR-1 100/100` means the fixed Remote Joining readiness model is fully satisfied by evidence for the architecture it measures: two private managers can establish the production connection remotely, use the Connected Rivalry/private-session boundaries, survive the tested reconnect conditions safely, preserve authorization and local-save protections, and complete the proven Remote Joining lifecycle on the stable zero-billing production release.

It does not mean the web application has become a real-time football match engine, remote-control layer for FIFA 17, or continuous live multiplayer game-streaming system. Actual FIFA match gameplay still occurs in FIFA 17 on each manager's own console/game environment. Career Mode Showdown coordinates the showdown state, identities, pairing/session lifecycle, shared authoritative showdown projection, recovery and explicit local synchronization boundaries.

A future product milestone may further automate or deepen which showdown setup/results fields flow through Connected Rivalry, but that would be product expansion after RJR100 rather than a missing requirement of the fixed RJR-1 model.
