# Audit: js/sparkSharedShowdownSetup.js, first half (lines 1-130)

Job 1525 · Queue item 0118 · Read on factory/gameplay-v1 @ 986c7a1e1 (the file on qa/mega-audits differs; the active gameplay line was audited).

## Finding 1 · SURE · lines 67-73 and 100 · the provider never rejects an expired session

What the player sees: normally nothing, because the client gate in js/productionSharedShowdownSetup.js (line 107) already refuses to start Shared Setup after the session expires. But the provider's own check can be bypassed: a write that reaches the provider with an expired session still passes, so a stale or modified client could still draw, commit or confirm Shared Setup after the session has ended.

Why: the authority built for each write forces the session expiry to be at least one millisecond after the clock, so the protocol's check (`value.nowEpochMs >= session.expiresAtEpochMs`, js/sharedShowdownSetup.js line 69) can never be true:
```
session:{...,expiresAtEpochMs:Math.max(epochMs+1,session.expiresAt)},nowEpochMs:epochMs
```
Also, `assertSession` (line 67) takes `epochMs` but never compares it with `expiresAt`; line 73 only checks that `expiresAt` is finite.
Smallest change: in `assertSession`, fail with SETUP_ACTIVE_SESSION_REQUIRED when `expiresAt<=epochMs`, and in `authority` use `expiresAtEpochMs:session.expiresAt` instead of `Math.max(epochMs+1,session.expiresAt)`. Keep the rebuild path (`syntheticSession`, `epochMs:0`, `expiresAt:2`) working by passing a clock of 0 as it does now.

## Riskiest places checked (no other finding)

- Lines 77 and 79-87, the ledger shape: `expectedPhase`, the operation-type sequence, the base revisions, the coordinator on the first four actions, and the confirmations after revision 4 all match the protocol phases, so a corrupted ledger is rejected.
- Lines 59-62, the two-manager binding: two distinct accounts, both authorised, each with an active entitlement, a profile and a save id. This matches the commit provider (sparkSharedSeasonCommit.js line 53).
- Lines 109-127, `rebuild`: the setup is replayed from the ledger with a synthetic session whose expiry is 2 ms. This is safe because the replay uses clock 0, but it only works because of the bypass in Finding 1, so the fix must keep the replay clock at 0.
