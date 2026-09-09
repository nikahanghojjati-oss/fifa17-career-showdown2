# Career Mode Showdown v1.9.1-r9 Shared Season Results

Status: RELEASE CANDIDATE
Application version: `v1.9.1`
Runtime asset revision: `1.9.1-r9`
Previous known-good runtime: `1.9.1-r8`
Remote Joining readiness: `100/100` under frozen model `RJR-1`
Shared Showdown Journey readiness under `SSJR-1.1`: `0/100`

## Purpose

r9 advances the actual Shared Showdown Journey beyond the r8 Shared Transfer Challenge by adding Shared Season Results publication for the current shared season.

After confirmed Shared Setup, ready Shared Career Start, and a completed same-season Shared Transfer Challenge, each of the two bound managers can enter the existing Season Results screen on their own device and privately review the same canonical seven FIFA 17 result fields: league position, league points, league goals, Domestic Cup, Champions League, Top Scorer, and Top Assist.

## Shared Season Results authority

Each manager may publish exactly one immutable result for their own role and season. Publication is CAS/revision bound and idempotency protected. A stale base revision, mismatched operation replay, wrong manager role, wrong Save/rivalry/season context, inactive device/session, or incomplete predecessor state fails closed.

The first manager's result stays private from the opponent until both managers have published. After both distinct roles publish, both result cards can be revealed to both managers. This r9 capability deliberately does not make shared scoring authoritative, does not commit a shared season winner, and does not mutate canonical local Save Library storage.

The reviewed result is fingerprinted before publication and re-read from the form immediately before the immutable provider write. A result changed after review is rejected and must be reviewed again.

## Player-facing journey

The existing Transfer Challenge verdict screen and Showdown Home can route into the existing Season Results shell only after refreshed r9 shared authority proves the exact current Save, rivalry, season, and completed remote Transfer Challenge.

Each manager sees only their own editable seven-field Season Results card before publication. The opponent card remains hidden until both managers publish. A waiting first publisher retains a visible Showdown Home escape.

Historical ordered Transfer Challenge replay remains read-only and cannot fall through into live Shared Season Results.

## Whole-shell boundary

Executable browser behavior changed, so r9 is a fresh whole-shell identity. The Service Worker current runtime is `1.9.1-r9`; coherent `1.9.1-r8` remains the immediate previous known-good recovery target.

The r9 shell adds all four Shared Season Results runtime files to the verified installed-app cache:

- `js/sharedSeasonResults.js`
- `js/sparkSharedSeasonResults.js`
- `js/productionSharedSeasonResults.js`
- `js/productionSharedSeasonResultsRoute.js`

HTML asset revision, direct core asset query strings, manifest icon revisions, menu visual revision, lazy runtime loading, Service Worker cache identity, and release authority must converge on `1.9.1-r9`. A mixed r8/r9 shell is not a valid release candidate.

## Firestore and zero-billing boundary

The deterministic additive production Rules build composes the reviewed Shared Setup, Career Start, Transfer Challenge, and Season Results fragments onto the unchanged Spark base.

Firebase remains Spark and billing remains permanently OFF. No Blaze, Cloud Billing linkage, payment method, purchased credits, Cloud Run, or Cloud Functions are permitted. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Exactly two private managers remain required. No public discovery, listing, lobby, matchmaking, community, rankings, or global leaderboard is introduced.

Canonical local gameplay storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`.

## Product-credit truth

This implementation, CI, Rules publication, merge, and deployment earn zero SSJR credit by themselves. SSJR-1.1 remains `0/100` until genuine two-account production evidence satisfies its fixed acceptance model.

Milestone Delivery Progress may advance only when its separate lifecycle rules are actually satisfied. Candidate work cannot claim product-integration credit before coherent merge/deployment proof.

After r9 is coherently integrated, the next SSJR capability is the authoritative shared season commit/scoring boundary rather than local-only season persistence.
