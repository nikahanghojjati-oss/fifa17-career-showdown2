# Career Mode Showdown v1.8.1 — Pairing Identity UX Hardening

Status: RELEASE CANDIDATE

Application version: `v1.8.1`
Runtime asset revision: `1.8.1-r1`
Release tag: `v1.8.1`
Previous known-good runtime: `1.8.0-r1`
Branch: `agent/v181-pairing-ux-hardening`
Remote Joining readiness baseline: `78/100` under fixed model `RJR-1`

## Scope

This backward-compatible patch fixes the manager-selection and error-guidance defects witnessed during real two-device private pairing:

- selected Player One/Player Two identity is keyed to stable manager role, `profileId` and `saveId`, never a transient option index;
- selection survives busy, success and failure rerenders;
- changing the selected manager does not erase an already pasted pairing capability;
- denied, consumed, expired or otherwise opaque pairing outcomes use one safe non-enumerating message with a fresh-code / Connected-Rivalry recovery path;
- successful pairing copy points at the already-shipped explicit Connected Rivalry actions while keeping Remote Joining locked;
- deterministic contracts and a rendered mobile-browser regression prove Player Two persistence through both successful creation and denied redemption.

## Safety and recovery

This candidate changes no Firestore Rules and does not require a Rules republish. Production blob `ecc8ccb2ab50f0f7057ab3170eb080ad9e36025f` remains authoritative. Firebase stays Spark / zero billing, App Check enforcement stays OFF, Firestore stays memory-only and Google authentication stays popup-only `browserSessionPersistence` without extra scopes.

Canonical localStorage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns` and `careerModeShowdown.preferences`. Candidate C remains the sole destructive local Apply authority with immutable intent, verified backup, strict exact raw snapshot guards, transaction-owned mutation, stale/anti-clobber rejection, ownership-scoped rollback and exact recovery verification. The Installable Offline App and local recovery routes remain available without Firebase.

Exactly two private managers remain the only model. No public discovery, community, matchmaking, invitation directory, leaderboard, ranking, Stage 5 session document, presence or lobby behavior is added.

## Promotion gate

Require the complete repository contract suite, focused rendered-browser evidence, all permanent pull-request workflow families, clean submitted reviews, zero unresolved inline threads, clean mergeability, expected-head merge protection and deployed whole-shell verification. Standing owner authorization permits merge/deployment only after those gates pass.

Source, tests, CI, review, merge and deployment do not increase RJR-1. The recorded move from 77 to 78 comes only from separate owner-proven Chromebook/iPhone physical-device evidence. On failure, preserve local data and recover the complete shell to `1.8.0-r1`; never mix runtime generations.
