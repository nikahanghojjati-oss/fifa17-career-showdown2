# Journey Reconnect r14 candidate boundary

Date: 2026-09-10

Capability: `journey-reconnect`

Frozen milestone weight: 5

Target runtime after publication: `1.9.1-r14`

Current rollback runtime: `1.9.1-r13`

## Candidate scope

This candidate recovers the already committed Shared Showdown journey after offline transitions, reload/re-entry, private-session expiry and exact-session replacement. It reuses authoritative Shared Setup, Multi Season progression and Remote Joining rather than creating a parallel provider model.

The durable journey remains rivalry-owned. Private session state is replaceable authorization only. Unknown, malformed, missing, revoked or expired session authority is never ACTIVE.

Journey Reconnect is read-only. It does not mutate canonical Save Library state, does not require a provider write, does not require collection listing and does not change the permanent zero-billing boundary.

## Candidate proof already completed

Before this final connector-authored candidate boundary, the bounded Journey Reconnect deterministic contract and production contract passed. A two-context desktop/mobile Playwright audit also passed active recovery, OFFLINE_HOLD, network restoration, expired-session rejection, fresh-session reauthorization, fresh-runtime reconstruction and terminal non-resurrection.

Those earlier runs are implementation evidence only. They do not validate this exact candidate head and must not be combined with later acceptance evidence.

## Exact-head acceptance rule

Normal pull-request POS20 must validate this exact connector-authored candidate head before publication. Any substantive change creates a new candidate and requires fresh validation. An Actions-generated publication commit is not acceptance authority by itself.

MDP remains `77.50/100` until sequential lifecycle exit gates are genuinely closed. SSJR remains `0/100` until separate genuine production-two-account evidence is accepted.

## Permanent locks

Firebase remains Spark-only. Billing remains OFF. App Check enforcement remains OFF. Cloud Run and Cloud Functions are not required. Exactly two private managers remain the product boundary. No public discovery, public matchmaking, community or ranking expansion is introduced. Canonical local Save authority and its existing storage keys remain unchanged.
