# Career Mode Showdown v1.9.1-r10 Shared Season Commit

Status: RELEASE CANDIDATE
Application version: `v1.9.1`
Runtime asset revision: `1.9.1-r10`
Previous known-good runtime: `1.9.1-r9`
Remote Joining readiness: `100/100` under frozen model `RJR-1`
Shared Showdown Journey readiness under `SSJR-1.1`: `0/100`

## Purpose

r10 advances the Shared Showdown Journey beyond r9 Shared Season Results by adding an authoritative shared Season Commit boundary for the exact current rivalry and season.

After both bound managers have immutably published r9 Shared Season Results and the remote result authority is exactly `RESULTS_READY` revision 2, the confirmed Shared Setup coordinator may create one immutable shared season snapshot. Both managers must then independently acknowledge that same committed snapshot before the Season Commit reaches terminal `ACKNOWLEDGED`.

## Season Commit authority

The commit binds the exact two published seven-field FIFA 17 result payloads from r9. It is rivalry, session, device, manager-role, season, revision and idempotency bound. Only the confirmed coordinator can create the commit. A stale base revision, wrong role, inactive account/device/session, result mismatch, wrong season, invalid operation replay or unconfirmed predecessor authority fails closed.

After commit creation, each of the two managers may record their own acknowledgement exactly once. The production adapter performs one bounded read-and-retry when a legitimate concurrent acknowledgement produces a stale CAS result. Terminal authority requires both distinct manager roles.

r10 does not calculate shared scoring, determine a shared season winner, advance canonical season history, or mutate canonical local Save Library storage. Those remain later explicit capabilities.

## Player-facing journey

r10 reuses the existing r9 Season Review surface after both private result publications have been revealed. It adds a shared-only Season Commit action that is separate from the ordinary local `CONFIRM & SAVE SEASON` control.

The coordinator sees `COMMIT SHARED SEASON`. The other manager waits read-only until the commit exists. After commit creation, each unacknowledged manager sees `ACKNOWLEDGE SHARED SEASON`. After both acknowledgements, both devices converge on `SEASON COMMIT ACKNOWLEDGED`, while shared scoring remains visibly locked for the next capability.

The local Season Engine confirmation path remains intact for ordinary local Showdowns and is never invoked by the r10 shared adapter.

## Whole-shell boundary

Executable browser behavior changed, so r10 is a fresh whole-shell identity. The Service Worker current runtime is `1.9.1-r10`; coherent `1.9.1-r9` remains the immediate previous known-good recovery target.

The r10 installed shell adds:

- `js/sharedSeasonCommit.js`
- `js/sparkSharedSeasonCommit.js`
- `js/productionSharedSeasonCommit.js`

HTML asset revision, direct core asset query strings, manifest icon revisions, menu visual revision, lazy runtime loading and Service Worker cache identity must converge on `1.9.1-r10`. A mixed r9/r10 shell is not a valid release candidate.

## Firestore and zero-billing boundary

The deterministic additive production Rules build composes the reviewed Shared Setup, Career Start, Transfer Challenge, Season Results and Season Commit fragments onto the unchanged Spark base.

Firebase remains Spark and billing remains permanently OFF. No Blaze, Cloud Billing linkage, payment method, purchased credits, Cloud Run or Cloud Functions are permitted. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Exactly two private managers remain required. No public discovery, listing, lobby, matchmaking, community, rankings or global leaderboard is introduced.

Canonical local gameplay storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`.

## Product-credit truth

Source implementation, CI, Rules publication, merge and deployment earn zero SSJR credit by themselves. SSJR-1.1 remains `0/100` until genuine two-account production evidence satisfies its fixed acceptance model.

Milestone Delivery Progress is separate. Candidate work may receive only lifecycle stages whose exit rules are actually proven; product-integration credit cannot be claimed before coherent merge and deployment proof.

After r10 is coherently integrated, the next engineering capability is canonical shared scoring. Genuine production two-account Season Commit evidence may also begin contributing to SSJR only through the frozen SSJR evidence model.