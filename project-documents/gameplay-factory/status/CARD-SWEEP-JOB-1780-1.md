# CARD-SWEEP-JOB-1780-1 · Expired private season session still opens Results

- Verdict: STILL OPEN (confirmed against `gameplay/bug-list-1`, `js/sparkSharedSeasonResults.js` blob `3733a040777722d39c438ee7cb1aacd09dec1ee1`).
- Origin: `SWEEP-JOB-1780.md`, finding row 1.
- Lane: Work mode (provider logic plus contract test, no browser required).
- Size: S (one-line condition, under 20 changed source lines).

## What the player sees

After the two managers' private session expires, a manager can still enter shared Season Results and, when the prerequisite season is complete, publish their scores. The connection should no longer authorize these actions after expiry even if the saved session's state still says `active`.

## Where in today's game

`js/sparkSharedSeasonResults.js:60-64`, session authority check:

```js
function ssrpAssertSession(value,rivalryId,sessionId,authorized,now){
  if(!value||value.objectType!=="session"||value.objectId!==sessionId||value.lifecycleState!=="live"||!value.data)ssrpFail("SEASON_RESULTS_SESSION_INVALID");
  const members=Array.isArray(value.data.memberAccountIds)?value.data.memberAccountIds:[],expires=ssrpTimestampMillis(value.data.expiresAt);
  if(value.data.rivalryId!==rivalryId||value.data.state!=="active"||members.length!==2||new Set(members).size!==2||!authorized.every(id=>members.includes(id))||!members.every(id=>authorized.includes(id))||!Number.isFinite(expires))ssrpFail("SEASON_RESULTS_ACTIVE_SESSION_REQUIRED");
}
```

The `now` argument is passed from `ssrpContext` at `js/sparkSharedSeasonResults.js:135`; that context is used by `read` (line 151) and `publishResult` (line 160).

## Why

The game checks that the expiry timestamp is a number but never checks whether the request time has reached it. An expired active-looking session therefore passes authority validation.

## How to reproduce

Use the in-memory Firestore harness in `tests/contracts/shared-season-results-provider-contracts.cjs:28-62`. It saves an active session with `expiresAt:ts(10_000_000)` (line 38) and creates valid account, device, rivalry, setup, Career Start and completed Transfer Challenge records. With `h=createHarness()`:

1. `await Provider.read(h.options('playerOne',9_999_999))`: correctly returns `ok:true`.
2. `await Provider.read(h.options('playerOne',10_000_000))`: wrong today, still `ok:true`; should return `{ok:false,code:'SEASON_RESULTS_ACTIVE_SESSION_REQUIRED'}`.
3. `await Provider.publishResult({...h.options('playerOne',10_000_001),operationId:resultOp(1),baseRevision:0,result:p1Result})`: wrong today, publishes instead of rejecting the expired connection.

## Failing test to write

`tests/contracts/sweep-expired-season-results-contracts.cjs`

Copy the transaction-store sandbox and `createHarness` pattern from `tests/contracts/shared-season-results-provider-contracts.cjs` (lines 23-62, 79-95); import `../../js/sparkSharedSeasonResults.js`. Set the same session expiry to 10,000,000 ms. Assert: read at 9,999,999 ms is accepted; read at 10,000,000 and 10,000,001 ms returns `SEASON_RESULTS_ACTIVE_SESSION_REQUIRED`; expired `publishResult` returns that code and leaves the public Results document absent. Today's wrong outcome is `ok:true` at/after expiry and a new public Results document on the publish path. Run with `node tests/contracts/sweep-expired-season-results-contracts.cjs`.

## Smallest fix

Add `||now>=expires` to the existing `ssrpAssertSession` rejection condition. Keep the existing error code; add no new screens, rules, or score calculations. Test the instant just before expiry, exactly at expiry, and after expiry.

## Risk and callers checked on today's branch

- Direct game caller: `js/productionSharedSeasonResults.js:33-35,63,84,182,188` loads `CareerModeSparkSharedSeasonResults` and calls its `read` and `publishResult` methods. Expired results screens, polling/retries, and the Publish Results tap will now correctly reject.
- Screen route: `js/productionSharedSeasonResultsRoute.js:73-75` opens that adapter, so its entry view will reflect the new denial; the route does not bypass provider authority.
- Related regression coverage: `tests/contracts/shared-season-results-provider-contracts.cjs` and `tests/contracts/shared-season-results-production-contracts.cjs`; preserve valid sessions, private score reveal, and race handling. The change is only in this provider, not the canonical local save.

No game code was modified by this card.
