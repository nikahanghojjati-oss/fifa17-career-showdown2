# JOB-1486 — Second-half audit of `js/sparkSharedTransferChallenge.js`

Scope: read-only gameplay audit of the shared-transfer challenge provider's transaction, projection, clock and session logic. No game code changed.

## 1. SURE — A manager's device clock controls whether an expired window can advance

**File/lines:** `js/sparkSharedTransferChallenge.js:128, 172` (also `:112-119, 177`).

**Player impact:** A manager whose phone/browser clock is behind the real time can get `TRANSFER_WINDOW_STILL_OPEN` after the transfer window has actually expired, leaving the Guess Entry screen inaccessible from that device until its local clock catches up. A clock set ahead can pass the provider's expiration guard early; if Firestore rules do not separately reject the write by server time, that manager can close the transfer window prematurely for both players.

**Why:** `ctx.now` is taken from caller-supplied `options.nowEpochMs` (falling back to local `Date.now()`), but the persisted window start uses the server timestamp. The advancing guard compares these clocks directly:

```js
if(ctx.now<next.startedAtEpochMs+protocol.windowMs)stspFail("TRANSFER_WINDOW_STILL_OPEN");
```

The provider therefore does not itself enforce its advertised server-authoritative deadline.

**Smallest change:** Gate `advance-expired-window` using trusted server time, such as a Firestore rule checked against `request.time` plus a matching provider-side authoritative cutoff, rather than accepting `ctx.now` as proof that time has elapsed. Preserve the existing phase transition and revision increments.

## 2. PROBABLE — Expired active-session records pass the session guard

**File/lines:** `js/sparkSharedTransferChallenge.js:74-78, 130`.

**Player impact:** If a session document still says `state:"active"` after its `expiresAt` deadline, the transfer provider treats it as a valid connected session. The player may be allowed to lock guesses/signings under an expired connection, or receive an opaque permission failure later if backend rules independently enforce expiry, instead of the provider's `TRANSFER_ACTIVE_SESSION_REQUIRED` result.

**Why:** The guard parses and validates the expiration timestamp but never compares it with the supplied `now` argument:

```js
const members=Array.isArray(value.data.memberAccountIds)?value.data.memberAccountIds:[],expires=stspTimestampMillis(value.data.expiresAt);
if(value.data.rivalryId!==rivalryId||value.data.state!=="active"||members.length!==2||new Set(members).size!==2||!authorized.every(id=>members.includes(id))||!members.every(id=>authorized.includes(id))||!Number.isFinite(expires))stspFail("TRANSFER_ACTIVE_SESSION_REQUIRED");
```

**Smallest change:** Reject sessions whose `expiresAt` is in the past in `stspAssertSession`, with a trusted current-time check (and consistent server-side expiry enforcement); return the existing `TRANSFER_ACTIVE_SESSION_REQUIRED` code. Reuse a server-authoritative clock rather than introducing a second client-clock dependency.

## Audit conclusion

Two concrete clock/session guards need lead review. Neither finding requires changing screen order, scoring, or the transfer challenge's rules. No source files or tests were modified.
