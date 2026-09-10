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

Candidate `6991e57b8f6029a2d2cb59e8d70a4d51d0ab1f0f` then received a completely fresh normal PR POS20 run. The selector, cognitive benchmark, operations authority, deterministic census, INLINE, STORAGE, VISUAL, STATIC and REMOTE lanes all passed. The inherited FULL lane failed twice on the unchanged head at the same post-reload acceptance-recorder checkpoint, so POS20 anti-spiral rules correctly ended retrying and forced root-cause investigation.

The r14 Journey Reconnect browser audit itself had already passed inside that FULL bundle. Instrumented post-reload evidence then proved the actual defect: the still-r13 service worker controlled the reloaded page and requested `js/sharedJourneyReconnect.js?v=1.9.1-r13`, but the two newly introduced r14 assets were absent from `SHELL_PATHS`. The service worker intentionally answers a versioned same-origin asset with `Response.error()` when it is not present in the selected runtime cache. As a result, `ssjr.js` stopped immediately after r13 Multi Season and never reached Journey Reconnect or the acceptance tooling that follows it.

A bounded product-integration correction therefore added exactly these runtime assets to the service-worker shell:

- `js/sharedJourneyReconnect.js`
- `js/productionSharedJourneyReconnect.js`

The r14 production contract now explicitly requires both assets in `service-worker.js`, and its POS20 supplemental registration now treats `service-worker.js` as an r14 production-impact path. The corrected integration passed the r14 production contract, the complete POS20 operations audit and the exact inherited SSJR production acceptance-recorder browser audit including its real reload under service-worker control. Temporary diagnostic workflow and script files were deleted by the successful publisher.

Historical candidates and their green lanes remain historical evidence only. This document update creates the fresh connector-authored candidate boundary after the proven service-worker integration correction. All required PR POS20 lanes and the exact-head cognitive seal must pass again on this new head; evidence must not be combined across candidate heads.

## Exact-head acceptance rule

Normal pull-request POS20 must validate this exact connector-authored candidate head before publication. Any subsequent substantive change creates a new candidate and requires fresh validation. An Actions-generated publication commit is not acceptance authority by itself.

MDP remains `77.50/100` until sequential lifecycle exit gates are genuinely closed. SSJR remains `0/100` until separate genuine production-two-account evidence is accepted.

## Permanent locks

Firebase remains Spark-only. Billing remains OFF. App Check enforcement remains OFF. Cloud Run and Cloud Functions are not required. Exactly two private managers remain the product boundary. No public discovery, public matchmaking, community or ranking expansion is introduced. Canonical local Save authority and its existing storage keys remain unchanged.
