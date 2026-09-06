# Career Mode Showdown v1.9.1-r3 Production Release

Status: RELEASE CANDIDATE / NOT YET PRODUCTION-PROVEN

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r3`

Previous known-good runtime: `1.9.1-r2`

## Production scope

This runtime revision introduces the smallest paired-first production Shared Showdown Setup milestone for exactly two private managers. It advances the existing private Remote Joining journey by making pairing plus an exact ACTIVE private session the mandatory authority before any shared league or club selection.

The shared path now preserves this mandatory order:

1. manager/profile inputs and a pre-draw Save Library shell;
2. exact Connected Rivalry pairing/attachment;
3. exact unexpired ACTIVE private session for that rivalry, account and registered browser;
4. one authoritative Shared Setup league draw;
5. two distinct permanent clubs from that league;
6. one authoritative `1 / 3 / 5 / 10` season length;
7. dual manager confirmation of the identical setup.

The pre-draw shared-mode marker is non-secret and is stored with the Save Library shell so a reload cannot expose the local league or club path. Capture-phase guards also block the actual bound local league/club controls while the shared setup is pending, including a modified client that removes `disabled` attributes.

The Shared Setup provider continues to use repository-owned immutable draw catalog authority, fresh idempotency operation IDs and CAS revision checks. A fresh ACTIVE private session for the same rivalry resumes the existing Shared Setup and never redraws it.

This milestone does not add transfer, results, scoring, history or later Shared Journey transport. Candidate C remains the sole destructive remote-to-local gameplay Apply authority.

## Production Firestore Rules

The production Firestore authority is generated deterministically from the already-reviewed `firestore.spark.rules` base plus only the bounded `firestore.shared-setup-production.fragment.rules` splices. The permanent PR lane and the main-only deployment lane run the same adversarial Shared Setup provider emulator against the generated production Rules.

The main-only publisher:

- creates the Firebase Rules ruleset first so provider compilation/validation occurs before the `cloud.firestore` release pointer changes;
- publishes only through `firebaserules.googleapis.com`;
- independently reads the live release and ruleset back;
- requires exact source content and Git-blob identity with the generated production source.

## Installed-app / whole-shell discipline

`1.9.1-r3` is a new whole-shell runtime because executable browser behavior changed. Reusing the already-deployed `1.9.1-r2` identity would permit stale Service Worker or browser cache state to mix old and new runtime files.

The r3 Service Worker shell therefore includes the complete production SSJR dependency chain, including `js/ssjr.js`, paired-first entry/guard/setup modules, the Shared Setup protocol/catalog, and the Spark Shared Setup adapter. `1.9.1-r2` remains the previous production-proven whole-shell recovery target. Never construct a mixed-version rollback.

## SSJR evidence truth

Source, tests, CI, PR review, merge, deployment, Rules publication and WEC packaging do not themselves earn Shared Showdown Journey Readiness credit. Fixed `SSJR-1.1` remains `0/100` until the required production two-account evidence layer proves the scored journey capabilities.

The consumed RJR physical acceptance remains historical RJR evidence and is not repeatable or recreditable unless an independently proven regression invalidates it.

## Permanent zero-billing locks

- Firebase remains on Spark.
- Billing must never be activated.
- Cloud Billing must remain disabled and no payment method may be attached for this project.
- Blaze must not be enabled.
- Cloud Run must not be enabled.
- Cloud Functions must not be enabled.
- No billing-required provider or service may be introduced.
- App Check enforcement remains OFF.
- Firestore browser persistence remains memory-only.
- Google authentication remains popup-only with `browserSessionPersistence` and no additional scopes.

## Privacy and product locks

- Exactly two already-paired private managers.
- No public discovery, listing, lobby, matchmaking, community surface, rankings or global leaderboard.
- Shared Setup does not directly mutate the three canonical local gameplay storage keys merely by reading or operating the remote setup.
- Candidate A remains non-mutating, Candidate B remains read-only, and Candidate C remains the sole destructive remote-to-local gameplay Apply authority.

## Publication proof

This section remains intentionally unsealed while PR #203 is open. Production-proven status requires the final exact PR head to pass all 15 permanent workflow families, review threads to be resolved, expected-head merge protection, post-merge workflow proof, exact zero-billing Firestore Rules publication/readback, and deployed `1.9.1-r3` runtime evidence.

## Recovery

`1.9.1-r2` is the previous production-proven whole-shell recovery target until and after r3 publication. Recovery must use a complete verified shell and must not activate billing or broaden provider authority.