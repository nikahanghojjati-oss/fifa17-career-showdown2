# sharedJourneyReconnect.js audit, second half (lines 91-180)

## 1. PROBABLE: an offline or pending state reports the remote session id as the current session (lines 81, 157, 159)

What the player sees: after a drop, the reconnect state can show a current session id (and `sessionId`) even though `activeAuthorization` is false and the phase is OFFLINE_HOLD or RECOVERY_PENDING. A UI that shows `sessionId` as "connected" would show a session that this device is not authorized to use.

Why: `jrBase` sets the session id from the remote value without checking whether the phase is authoritative:
`sessionId:remote?.sessionId||null,lastKnownSessionId:remote?.sessionId||previous?.lastKnownSessionId||...`
and `jrObserve` passes `remote` for the OFFLINE_HOLD branch (line 157): `jrBase({phase:"OFFLINE_HOLD",authority,remote,previous,networkOnline:false,...})`. `jrVerifyState` only checks that a sessionId is well formed (line 113), so the value passes.

Smallest change: in `jrBase`, set `sessionId: activeAuthorization ? (remote?.sessionId||null) : null`, and keep `lastKnownSessionId` as it is so the session-change check (line 82) still works. Check that no caller reads `sessionId` as "current" while offline.

## 2. Riskiest place checked: `jrAssertMonotonic` (lines 144-153)

The terminal and history checks run only when `next.recovered` is true. Non-recovered phases skip them by design, but `jrBase` carries `terminal` and `durableKey` from `previous`, so the carried values stay monotonic.

## 3. Riskiest place checked: `jrVerifyAcceptedRevisionKey` (lines 97-106)

The per-season revision regex is built from the index, so a key that skips or reorders a season fails. This looked correct.
