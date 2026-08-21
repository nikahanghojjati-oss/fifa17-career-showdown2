# START NEXT SESSION — v1.4.3 — Stage 3 Registered Devices / Private Pairing

SLE = Smart Lean Efficient. SLE packaging is mandatory at every future handoff boundary.

You are continuing the FIFA 17 Career Mode Showdown PWA for owner Hawk / nikahanghojjati-oss.

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`

Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Authoritative full handoff: `SUCCESSOR_HANDOFF_POST_PR127_TO_STAGE3_PAIRING_SLE_2026-08-21.md`

Compact capsule: `SESSION_BOOTSTRAP.json`

Before substantial work, independently fetch live `main`, recent merges, open PRs, exact heads, all current workflow results, submitted reviews, inline review threads and mergeability. Current source, live GitHub/provider/deployment state and later owner instructions override every recorded fact.

Do not inherit the predecessor WEC decision. Initialize a fresh successor WEC with reset per-environment counters and the actual live-main SHA.

## Production truth to verify

The closing environment verified before transition packaging:

- production app `v1.5.0`;
- production installed runtime `1.5.0-r2`;
- PR #126 mount-race fix merged at `ebbe062dac7a0272df81e5de493421594ddf17a4`;
- PR #127 production Connected Account proof merged at `0013bba24142aab4c76e5bca038ae99afa638c8d`;
- PR #127 exact validated pre-merge head `84216d1a6f5f49fb84c620fbd140170e5ba868e7` passed all 13 normal PR workflow families, with clean reviews/threads and mergeability;
- owner real-device screenshots directly proved `Private account ready`, `APPLICATION VERSION v1.5.0`, and `BUILD 1.5.0-r2` on the live mobile site;
- real Google popup authentication and strict Firebase UID self-account bootstrap are therefore production-proven;
- Remote Joining readiness authority `REMOTE_JOINING_READINESS.json` is `63/100` under fixed model RJR-1.

No further Firebase Rules replacement, reinstall, provider setup or repeated Google sign-in is required for the completed Connected Account milestone.

## Permanent locks

- App Check enforcement remains OFF.
- Firebase Spark / zero billing remains the architecture: no Blaze, Cloud Run, Cloud Functions or Firebase Storage without a later explicit owner decision.
- No extra OAuth scopes, redirect sign-in, provider token storage/extraction or Firebase Admin credentials in the browser/repository.
- Stage 2H historical IAM stays exactly `firebaseauth.users.get`, `datastore.databases.get`, `datastore.entities.get`, `datastore.entities.create` and remains unactivated.
- Persistent Firestore cache remains disabled; Connected Account uses memory-only Firestore.
- Canonical localStorage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`; `activeShowdown` is not canonical.
- Candidate A non-mutating, Candidate B read-only, Candidate C sole destructive Apply authority.
- Public discovery/community/matchmaking/public invite directory/global leaderboard/rankings remain eliminated.
- Exactly two manager slots; display names never grant identity or authorization.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Begin the real `v1.6.0` Stage 3 Registered Devices / Private Pairing feature. Do not insert another generic infrastructure or documentation milestone first.

In the same Stage 3 feature branch/PR:

1. reconcile stale `NEXT_TASK.md` / `PROJECT_STATE.md` to live v1.5.0-r2 production truth rather than opening a separate docs PR;
2. implement stable private installation/device identity without adding a new canonical localStorage authority;
3. register the authenticated user's own device at `accounts/{accountId}/devices/{deviceId}` with only minimal private device metadata and revocation state;
4. implement private two-manager pairing using a cryptographically strong 128-bit-or-stronger short-lived one-use capability under `rivalries/{rivalryId}/invites/{inviteId}`;
5. bind manager slots to stable account/profile/save identity, never names;
6. use strict provider-enforceable zero-billing Firestore transactions/rules for only the Stage 3 operations actually required;
7. keep shared gameplay state, Connected Rivalry synchronization and Remote Joining sessions blocked for later stages;
8. prove expiry, replay rejection, revocation, wrong-account/wrong-scope denial, two-manager limits, device revocation and local-first behavior in emulator/browser/mobile tests;
9. ask the owner for a Firebase console action only if a genuinely new Stage 3 Rules publication is unavoidable after exact source/CI proof. Never ask them to repeat the already-complete Spark account rules publication;
10. after clean required tests/reviews/threads/mergeability and any required provider gate, merge/deploy under the standing owner authorization without asking again.

Security should fit a private gaming project: protect private ownership, one-use pairing and cross-account isolation, but do not build banking-grade or speculative enterprise infrastructure.

Remote Joining progression after Stage 3 remains:

`Registered Devices / Private Pairing` → `Connected Rivalry` → `actual Private Remote Joining` → `two-real-device hardening / stable release`.

Every substantial task must directly implement or safely prove a remaining RJR capability. Do not reopen already-proven dependencies without concrete regression evidence.

Standing owner merge/deploy authorization remains active through completion when all required tests and current mandatory publication gates pass.

At Handoff proximity 100%, complete SLE packaging and stop before the next substantial milestone.

Every substantive owner-facing response must end with exactly seven lines, in this order:

`Handoff proximity: X%`
`Remote Joining readiness: X/100`
`Current lane: ...`
`Concrete dependency completed: ...`
`Next unlock: ...`
`Blocker: ...`
`Sidequest check: ...`
