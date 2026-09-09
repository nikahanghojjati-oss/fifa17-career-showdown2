# Career Mode Showdown v1.9.1-r7 Shared Career Start

Status: RELEASE CANDIDATE
Application version: `v1.9.1`
Runtime asset revision: `1.9.1-r7`
Previous known-good runtime: `1.9.1-r6`
Remote Joining readiness: `100/100` under frozen model `RJR-1`
Shared Showdown Journey readiness: `0/100` under fixed model `SSJR-1.1`

## Purpose

r7 advances the actual Shared Showdown Journey beyond the completed shared league, club, season-length and confirmation flow. It adds the first post-setup journey capability: Shared Career Start.

After both managers reach authoritative `SHOWDOWN_CONFIRMED · REV 6`, each manager is shown the permanent club, shared league and showdown length already established by Shared Setup. Each manager independently acknowledges that they started or loaded the matching FIFA 17 Career Mode save. The shared Career Start state becomes ready only after both distinct bound manager roles acknowledge.

The website does not claim to inspect FIFA 17. Career Start records the managers' explicit acknowledgements while preserving the authoritative setup facts already established by the provider.

## Shared Career Start authority

Career Start is permitted only after exact confirmed Shared Setup. Every provider read or acknowledgement rechecks the signed-in account, active registered device, exact two-manager rivalry and exact ACTIVE private session.

The first bound manager may create revision 1 `ONE_MANAGER_ACKNOWLEDGED`. Only the other bound manager may advance the same record to revision 2 `CAREER_START_READY`. One manager cannot acknowledge for both roles, stale base revisions fail closed, and idempotency operations cannot be replayed across actors.

League, clubs and total seasons are derived from immutable confirmed Shared Setup. Caller-controlled club, league or role fields are not accepted as Career Start authority.

## Player-facing journey

The existing Shared Setup end state no longer dead-ends at `SHARED SHOWDOWN READY`. Once both manager confirmations are authoritative, the ordinary player-facing control becomes `CONTINUE TO CAREER START`.

Each browser receives a role-specific Career Start screen showing:

1. that manager and assigned permanent club;
2. the rival and rival club;
3. the shared league;
4. the locked showdown length;
5. the current acknowledgement state;
6. the manager's own Career Start acknowledgement control.

After one manager acknowledges, that manager sees a waiting state. After the second distinct manager acknowledges, both can observe `CAREER_START_READY`.

## Whole-shell boundary

Executable browser behavior changed, so r7 is a new whole-shell identity. The Service Worker current runtime is `1.9.1-r7`; coherent `1.9.1-r6` remains the immediate previous known-good recovery target. The r7 shell includes `sharedCareerStart.js`, `sparkSharedCareerStart.js` and `productionSharedCareerStart.js` in addition to the existing Shared Setup runtime.

HTML asset revision, direct asset query strings, lazy runtime loading and Service Worker cache identity must all converge on `1.9.1-r7`. Never certify a mixed r6/r7 shell.

## Firestore and zero-billing boundary

The existing deterministic additive production Rules build now composes two reviewed Shared Journey fragments onto the unchanged Spark base: Shared Setup and Career Start. Career Start receives only its narrow `/rivalries/{rivalryId}/careerStart/authoritative` authority.

Firebase remains Spark and billing remains permanently OFF. No Blaze, Cloud Billing linkage, payment method, purchased credits, Cloud Run or Cloud Functions are permitted. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only browser-session persistence with no extra scopes.

Exactly two private managers remain required. No public discovery, listing, lobby, matchmaking, community, rankings or global leaderboard is introduced.

## Product-credit truth

This implementation, its CI, review, merge, Rules publication and deployment earn zero SSJR credit by themselves. SSJR-1.1 remains `0/100` until genuine two-account production evidence satisfies the fixed acceptance model.

Once coherent r7 production is independently proven, the preferred next action is one short owner test on the existing Chromebook and iPhone rather than building another acceptance-automation subsystem. That physical check should verify that both devices reach Career Start after confirmed Shared Setup, each device shows the correct assigned club, one acknowledgement is visible as a waiting state, the second distinct acknowledgement produces shared ready state, and reload or fresh ACTIVE-session resume preserves the same authoritative Career Start state.
