# Audit: js/sharedShowdownSetup.js, first half (lines 1-118)

Job 1527 · Queue item 0122 · Read on factory/gameplay-v1 @ 986c7a1e1 (the file on qa/mega-audits differs; the active gameplay line was audited).

## Findings

no findings

## Riskiest places checked (no finding)

- Line 69, `value.nowEpochMs >= session.expiresAtEpochMs` fails with SETUP_ACTIVE_SESSION_REQUIRED. This protocol check is correct. The gap is in the provider, which builds an expiry that is always in the future (js/sparkSharedShowdownSetup.js line 100, reported as sparkSharedShowdownSetup-1.md Finding 1). Fixing the provider makes this check effective.
- Lines 49-73, the authority shape: the exact key lists (`rivalryId`, `connectionState`, `managerSlots`, `actor`, `session`, `nowEpochMs`, and the slot and session keys) match what js/sparkSharedShowdownSetup.js builds, so a valid authority is not rejected.
- Lines 60 and 65, two distinct accounts and an actor that matches its manager slot, so a manager cannot act for the other slot.
- Lines 81-84 and 104, the catalog and club pair: 2 to 20 distinct clubs per league, and both clubs must be in the chosen league and distinct, so a club pair cannot cross leagues or repeat.
- Lines 110-118, `verifyState`: the state is copied before the first await, so an async digest cannot validate one value and return another, and revision, receipts and confirmations are checked against each other.
