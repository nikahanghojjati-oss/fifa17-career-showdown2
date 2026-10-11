# Audit: js/sparkSharedSeasonCommit.js, first half (lines 1-58)

Job 1513 · Queue item 0094 · Read on factory/gameplay-v1 @ 986c7a1e1 (the file on qa/mega-audits differs; the active gameplay line was audited).

## Finding 1 · PROBABLE · lines 56 and 58 · session expiry is never checked

What the player sees: a season commit or acknowledgement can still be written from a session whose expiry has passed, if the session document still says `state:"active"`. This is a state-integrity gap more than a visible bug, so it depends on whether the session state is ever flipped after expiry.

Why: `scpAssertSession` takes `now` but never uses it. It only checks that `expiresAt` is a finite number:
```
function scpAssertSession(value,rivalryId,sessionId,authorized,now){ ... !Number.isFinite(expires))scpFail("SEASON_COMMIT_ACTIVE_SESSION_REQUIRED");return Object.freeze({hostAccountId:host});}
```
The authority object built by `scpAuthority` then hard-codes the expiry as far in the future and the clock as 0, so the protocol's own expiry check (if it has one) can never fail:
```
session:{...,expiresAtEpochMs:Number.MAX_SAFE_INTEGER},nowEpochMs:0
```
The caller at line 93 does pass `now` (`scpNow(options.nowEpochMs)`), so the fix is local.
Smallest change: in `scpAssertSession`, add `||expires<=now` to the failing condition. Then pass the real `expires` through to `scpAuthority` instead of `Number.MAX_SAFE_INTEGER`, and use `now` for `nowEpochMs`.

## Riskiest places checked (no other finding)

- Line 37, `scpBase` (n from 0 to 3): correct. js/sharedSeasonCommit.js allows revisions 1 to 3 (commit = 1, first acknowledgement = 2, second = 3), so the second acknowledgement's base revision of 3 is accepted.
- Line 57, `value.revision!==6` and the setup ledger shape: correct. Revision 6 is SHOWDOWN_CONFIRMED with two confirmations, the same value used in the results and commit UI gates.
- Line 53, binding checks: two distinct accounts, both authorized, each with an active entitlement and a profile and save id, so the two-manager pairing requirement holds.
