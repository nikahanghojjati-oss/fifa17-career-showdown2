# JOB-1488 · sharedTransferChallenge.js second half audit

no findings

Read: `js/sharedTransferChallenge.js` (lines 107 to 214, the middle to the end).

Riskiest places checked, none of which showed a real bug:

1. Lines 153-158 (`stcApply`): the idempotent replay check runs before the stale-revision check. A replayed `operationId` with the same command returns the current state. A replay with a different command throws `TRANSFER_IDEMPOTENCY_CONFLICT`. A double tap with a new `operationId` hits `TRANSFER_GUESSES_ALREADY_LOCKED`, `TRANSFER_SIGNINGS_ALREADY_LOCKED` or `TRANSFER_END_ALREADY_REQUESTED`, so it cannot act twice.
2. Lines 174-182 (`request-end-window`, `advance-expired-window`): the phase moves to `GUESS_ENTRY` and `endedAtEpochMs` is set exactly once, on the second end request or on expiry at `startedAtEpochMs + WINDOW_MS`. The expiry comparison is `now < start + WINDOW_MS`, so the boundary is correct.
3. Lines 199-209 (`stcProjectForRole`): the opponent's inputs are hidden until `COMPLETED`, and verdicts are built only when `COMPLETED`. The projection does not leak guesses or signings before both roles have locked.

Smallest possible follow-up, not a bug: `stcVerifyState` does not check that `endRequestedRoles` and `endedAtEpochMs` agree with the phase. Protocol-generated states always do, so no player can reach a mismatch.

No game file was edited. This job adds one audit file only.
