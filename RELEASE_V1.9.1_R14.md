# Career Mode Showdown v1.9.1 runtime r14

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r14`

Previous known-good runtime: `1.9.1-r13`

## Journey Reconnect

r14 integrates the SSJR-1.1 Journey Reconnect capability on top of the r13 Multi Season authority. It recovers the committed Shared Showdown journey after offline transitions, reload/re-entry, private-session expiry and exact-session replacement while preserving the confirmed league, permanent clubs, season plan and accepted progression.

The durable journey remains rivalry-owned and private-session state remains replaceable authorization only. Missing, malformed, revoked, expired or nonfinite-expiry sessions are never treated as ACTIVE. A fresh exact ACTIVE private session for the same rivalry may reauthorize the existing committed journey without redraw, reassignment, history reset or terminal resurrection.

Journey Reconnect is read-only. It does not mutate canonical Save Library state, require a provider write, require collection listing, introduce Cloud Run or Cloud Functions, or change the permanent zero-billing boundary.

## Reload and service-worker integration

The r14 Journey Reconnect protocol and production adapter are part of the verified service-worker shell. This closes a pre-publication defect found by the inherited FULL acceptance recorder proof where a reload under r13 service-worker control rejected the newly introduced Journey Reconnect asset. The corrected candidate passed the inherited recorder reload under service-worker control before publication.

## Validation boundary

Pre-publication candidate `487c1d41fa9a2b16097c9d8a68e8ebad4a27678e` passed normal PR POS20 run #368 including the exact-head cognitive seal. This publication commit creates new release bytes and therefore requires its own fresh exact-head POS20 validation before PR #242 can merge. Evidence must not be combined across heads.

Firebase remains Spark-only, billing remains permanently off and SSJR production-two-account acceptance remains separate from MDP engineering maturity.
