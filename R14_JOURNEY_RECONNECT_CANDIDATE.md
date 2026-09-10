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

The bounded Journey Reconnect deterministic contract and production contract passed. A two-context desktop/mobile Playwright audit also passed active recovery, OFFLINE_HOLD, network restoration, expired-session rejection, fresh-session reauthorization, fresh-runtime reconstruction and terminal non-resurrection.

Those bounded runs establish implementation behavior, but they do not replace normal exact-head PR POS20 acceptance.

## Exact-head regression history

Candidate `7ffc6bc3f395c5c3c12e158e683dc429cfc2d700` reached normal PR POS20. The exact selector and cognitive benchmark passed, while the operations authority correctly rejected one stale control-plane expectation: `tests/operations/pos20-control-plane.test.mjs` still expected the supplemental contract registry to end at r13 Multi Season even though the registry now correctly contained the r14 Journey Reconnect deterministic and production contracts.

No runtime behavior was weakened or changed in response to that failure. A bounded test-only correction extended the hard-coded expected supplemental list by exactly:

- `tests/contracts/shared-journey-reconnect-contracts.cjs`
- `tests/contracts/shared-journey-reconnect-production-contracts.cjs`

The complete `npm run test:ops` authority passed before that temporary correction publisher deleted itself.

Candidate `7ffc6bc3f395c5c3c12e158e683dc429cfc2d700` remains historical failure evidence only. This document update creates the fresh connector-authored candidate boundary after the proven operations correction. All required PR POS20 lanes and the exact-head cognitive seal must pass again on this new head; evidence must not be combined across candidate heads.

## Exact-head acceptance rule

Normal pull-request POS20 must validate this exact connector-authored candidate head before publication. Any subsequent substantive change creates a new candidate and requires fresh validation. An Actions-generated publication commit is not acceptance authority by itself.

MDP remains `77.50/100` until sequential lifecycle exit gates are genuinely closed. SSJR remains `0/100` until separate genuine production-two-account evidence is accepted.

## Permanent locks

Firebase remains Spark-only. Billing remains OFF. App Check enforcement remains OFF. Cloud Run and Cloud Functions are not required. Exactly two private managers remain the product boundary. No public discovery, public matchmaking, community or ranking expansion is introduced. Canonical local Save authority and its existing storage keys remain unchanged.
